# Design: user-action-logs-admin-reporting

## Design status

PROPOSED

## Reporting design

La fase 2 extiende el módulo `user-action-logs` como una capa administrativa de lectura agregada sobre los mismos registros ya persistidos en fase 1. No cambia la semántica de escritura, no introduce un pipeline secundario y no requiere materialized views ni snapshots nuevos en esta etapa.

El diseño se apoya en el query port existente y agrega cinco use cases nuevos orientados a reporting:

- `admin-user-action-log-summary.usecase.ts`
- `admin-user-action-log-activity-by-day.usecase.ts`
- `admin-user-action-log-top-actors.usecase.ts`
- `admin-user-action-log-top-actions.usecase.ts`
- `admin-export-user-action-logs.usecase.ts`

Todos los use cases comparten una misma base de filtros administrativos y dependen de un adapter Prisma que centraliza la construcción de `where` y las agregaciones.

## GraphQL contract

### Queries

```graphql
adminUserActionLogSummary(input: AdminUserActionLogReportInput!): UserActionLogSummary!
adminUserActionLogActivityByDay(input: AdminUserActionLogReportInput!): [UserActionLogActivityBucket!]!
adminUserActionLogTopActors(input: AdminUserActionLogTopInput!): [UserActionLogTopActor!]!
adminUserActionLogTopActions(input: AdminUserActionLogReportInput!): [UserActionLogTopAction!]!
adminExportUserActionLogs(input: AdminExportUserActionLogsInput!): UserActionLogExportPayload!
```

### Inputs

`AdminUserActionLogReportInput`

- `dateFrom: DateTime!`
- `dateTo: DateTime!`
- `actorUserId: ID`
- `action: UserActionLogAction`
- `resourceType: String`
- `resourceId: ID`

`AdminUserActionLogTopInput`

- `dateFrom: DateTime!`
- `dateTo: DateTime!`
- `actorUserId: ID`
- `action: UserActionLogAction`
- `resourceType: String`
- `resourceId: ID`
- `limit: Int`

`AdminExportUserActionLogsInput`

- `dateFrom: DateTime!`
- `dateTo: DateTime!`
- `actorUserId: ID`
- `action: UserActionLogAction`
- `resourceType: String`
- `resourceId: ID`
- `limit: Int`
- `offset: Int`

### Types

`UserActionLogSummary`

- `totalActions: Int!`
- `uniqueActors: Int!`
- `dateFrom: DateTime!`
- `dateTo: DateTime!`

`UserActionLogActivityBucket`

- `date: String!`
- `actionCount: Int!`
- `uniqueActors: Int!`

`UserActionLogTopActor`

- `actorUserId: ID`
- `actorEmail: String`
- `actorRole: String`
- `actionCount: Int!`
- `lastActionAt: DateTime!`

`UserActionLogTopAction`

- `action: UserActionLogAction!`
- `actionCount: Int!`

`UserActionLogExportPayload`

- `contentBase64: String!`
- `fileName: String!`
- `mimeType: String!`
- `sizeBytes: Int!`
- `generatedAt: DateTime!`

## Filters

Las cinco queries comparten los mismos filtros semánticos base:

- rango de fechas obligatorio,
- filtro opcional por actor,
- filtro opcional por acción,
- filtro opcional por `resourceType`,
- filtro opcional por `resourceId`.

Reglas de validación propuestas:

- `dateFrom` y `dateTo` son obligatorios en reporting fase 2 para evitar lecturas abiertas no acotadas,
- `dateFrom` debe ser menor o igual a `dateTo`,
- `limit` debe tener un tope razonable en top actors y export,
- `offset` solo aplica a export,
- campos opcionales ausentes no deben alterar el comportamiento base.

La construcción de filtros debe vivir en una sola función compartida del adapter Prisma o en un helper cercano para evitar divergencias entre summary, top lists y export.

## Prisma aggregations

El adapter `prisma-user-action-log-query.adapter.ts` se extenderá con operaciones de agregación específicas.

### Summary

La query summary necesita:

- conteo total de registros filtrados,
- conteo de actores distintos sobre `actorUserId`,
- eco del rango solicitado.

Estrategia Prisma:

- `count` para `totalActions`,
- `groupBy` por `actorUserId` o consulta equivalente para derivar `uniqueActors`,
- exclusión implícita de `actorUserId = null` del conteo de actores únicos si la semántica final exige actores identificados solamente.

### Activity by day

Prisma no resuelve de forma ideal el bucket diario con conteo de actores únicos por día en una sola operación portable, por lo que el diseño admite una de estas dos rutas mínimas:

- usar `queryRaw` parametrizado sobre PostgreSQL para agrupar por `date(created_at)` y calcular `count(*)` junto con `count(distinct actor_user_id)`, o
- componer una consulta Prisma acotada y agrupar en memoria si el rango permitido es pequeño y se valida explícitamente.

La opción preferida es `queryRaw` parametrizado porque reduce trasiego de filas y preserva el objetivo de reporting administrativo.

### Top actors

Se requiere agrupar por actor y devolver además `actorEmail`, `actorRole` y `lastActionAt`.

Estrategia propuesta:

- agrupar por `actorUserId`, `actorEmail` y `actorRole`,
- calcular `count(*)` y `max(createdAt)`,
- ordenar descendentemente por `actionCount` y luego por `lastActionAt`,
- aplicar `limit` validado.

### Top actions

Se requiere un ranking simple por `action`.

Estrategia Prisma:

- `groupBy` por `action`,
- `count(*)` por grupo,
- orden descendente por conteo.

## Export CSV

La exportación no persiste archivos ni historial. El CSV se genera on-demand desde el mismo módulo y se devuelve como base64.

Columnas iniciales recomendadas:

- `id`
- `createdAt`
- `actorUserId`
- `actorEmail`
- `actorRole`
- `action`
- `resourceType`
- `resourceId`
- `description`
- `metadataJson`
- `ipAddress`
- `userAgent`

Reglas de export:

- solo incluir campos ya disponibles en el log actual,
- no enriquecer con metadata adicional ni joins sensibles,
- escapar comas, comillas y saltos de línea correctamente,
- generar nombre de archivo determinista, por ejemplo `user-action-logs-YYYYMMDD-HHmmss.csv`,
- usar `text/csv; charset=utf-8` como `mimeType`,
- calcular `sizeBytes` desde el buffer final,
- poblar `generatedAt` en UTC.

## Security

Todas las queries de reporting fase 2 son exclusivas para `ADMIN` y `EMPLOYEE`.

El resolver existente debe extenderse manteniendo el patrón de guards/roles ya utilizado por `adminUserActionLogs`. No se debe relajar acceso ni duplicar lógica de autorización fuera del módulo.

Restricciones de seguridad:

- usuarios no admin no pueden acceder a summary, activity, top actors, top actions ni export,
- export solo expone los mismos campos seguros ya presentes en el dominio de logs,
- no se incorporan datos sensibles nuevos al payload,
- no se modifica la sanitización existente de `metadataJson`; solo se reutiliza.

## Limits

Para mantener el cambio mínimo y evitar consultas descontroladas:

- rango de fechas obligatorio en todas las queries de reporting,
- `limit` con default y máximo explícito para top actors,
- `limit` y `offset` con topes explícitos para export,
- sin soporte de agrupación semanal o mensual en esta fase,
- sin formatos distintos de CSV,
- sin scheduling, caching ni persistencia de resultados.

## Architecture impact

El módulo objetivo permanece en:

```txt
src/modules/user-action-logs/
  application/use-cases/
    admin-user-action-log-summary.usecase.ts
    admin-user-action-log-activity-by-day.usecase.ts
    admin-user-action-log-top-actors.usecase.ts
    admin-user-action-log-top-actions.usecase.ts
    admin-export-user-action-logs.usecase.ts
  domain/ports/
    user-action-log-query.port.ts
  infrastructure/adapters/
    prisma-user-action-log-query.adapter.ts
  presentation/graphql/
    inputs/
    types/
    resolvers/
```

No se requiere cambiar command port, entidad, wiring non-blocking ni puntos de integración de escritura.

## Alternatives considered

### 1. Usar dashboard frontend calculando todo

Descartado porque obligaría a descargar listados completos, duplicaría semántica de reporting fuera del backend y haría más difícil imponer límites y seguridad consistentes.

### 2. Persistir exports

Descartado en esta fase para evitar complejidad de almacenamiento, lifecycle, cleanup, historial de descargas y permisos adicionales. El objetivo actual es export on-demand con cambios mínimos.

### 3. Agregar alertas en esta fase

Descartado porque alerting introduce otra preocupación funcional distinta a reporting. Esta fase solo agrega lectura agregada y exportación administrativa, sin cambiar escritura ni observabilidad activa.