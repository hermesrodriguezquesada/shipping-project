# Proposal: user-action-logs-admin-reporting

## Change status

PROPOSED

## Problem

La fase 1 de `UserActionLogs` ya permite registrar acciones relevantes y consultarlas en listados (`myUserActionLogs` y `adminUserActionLogs`), pero todavía no ofrece capacidades administrativas de análisis agregado ni exportación on-demand.

Esto obliga a resolver reporting desde clientes o mediante consultas manuales sobre listados crudos, lo que dificulta obtener métricas operativas rápidas, detectar patrones de actividad y entregar evidencia exportable para soporte, auditoría interna y revisión administrativa.

## Motivation

Se necesita una fase 2 de reporting administrativo que reutilice la base de logs ya implementada sin alterar el comportamiento actual de escritura, sin volver blocking la auditoría y sin introducir cambios de seguridad o privacidad fuera del alcance aprobado.

El backend debe centralizar estas agregaciones para asegurar semántica consistente, control de acceso uniforme y un contrato GraphQL aditivo que el frontend pueda consumir sin recomputar métricas sensibles por su cuenta.

## Solution

Extender el módulo existente `src/modules/user-action-logs/` con consultas administrativas de reporting y exportación CSV on-demand.

La solución agrega:

- un summary administrativo por rango de fechas,
- buckets de actividad por día,
- ranking de actores más activos,
- ranking de acciones más frecuentes,
- exportación CSV base64 generada bajo demanda,
- filtros comunes por fecha, actor, acción y recurso,
- enforcement de acceso solo para `ADMIN` y `EMPLOYEE`.

La implementación se apoyará en nuevos use cases, extensión del query port existente, nuevas agregaciones Prisma y nuevos inputs/types GraphQL code-first, manteniendo sin cambios el registro actual de logs y las queries de fase 1.

## Scope

Dentro de alcance en esta fase 2:

- query `adminUserActionLogSummary(input: AdminUserActionLogReportInput!): UserActionLogSummary!`,
- query `adminUserActionLogActivityByDay(input: AdminUserActionLogReportInput!): [UserActionLogActivityBucket!]!`,
- query `adminUserActionLogTopActors(input: AdminUserActionLogTopInput!): [UserActionLogTopActor!]!`,
- query `adminUserActionLogTopActions(input: AdminUserActionLogReportInput!): [UserActionLogTopAction!]!`,
- query `adminExportUserActionLogs(input: AdminExportUserActionLogsInput!): UserActionLogExportPayload!`,
- filtros administrativos por `dateFrom`, `dateTo`, `actorUserId`, `action`, `resourceType` y `resourceId`,
- soporte de `limit` y `offset` para export y `limit` para top actors,
- generación de CSV y devolución como `contentBase64`,
- cambios mínimos sobre resolver, puertos y adapters existentes del módulo `user-action-logs`.

## Out of scope

Fuera de alcance en esta fase:

- cualquier cambio en la escritura actual de logs,
- cambios en la integración non-blocking de fase 1,
- cambios en `myUserActionLogs`,
- cambios en `adminUserActionLogs`,
- interceptor global o instrumentación automática transversal,
- alertas o detección proactiva de anomalías,
- persistencia de exports o historial de descargas,
- nuevos datos sensibles en metadata,
- formatos distintos de CSV en esta fase,
- cambios de frontend o dashboards fuera del contrato backend.

## Capabilities

### New Capabilities

- `user-action-logs-admin-reporting`: reporting administrativo agregado y exportación CSV on-demand sobre `UserActionLog`.

### Modified Capabilities

- None.

## Compatibility

La propuesta es aditiva y compatible hacia atrás:

- no cambia la persistencia ni el flujo de registro de auditoría ya implementado,
- no cambia contratos existentes de `myUserActionLogs` ni `adminUserActionLogs`,
- no altera integraciones non-blocking de fase 1,
- mantiene el modelo de seguridad actual reforzando acceso administrativo para las nuevas queries,
- no requiere migraciones de frontend para conservar comportamiento existente.

## Risks

- Riesgo de consultas agregadas costosas si el filtrado por rango o recurso no queda bien indexado o acotado.
- Riesgo de inconsistencias temporales si no se define claramente la semántica de `dateFrom` y `dateTo`.
- Riesgo de exponer más contexto del necesario en export si no se limita estrictamente a campos ya seguros del log.
- Riesgo de duplicar lógica de filtros entre queries si no se concentra en el query port/adapter.

## Impact

Superficie impactada:

- `src/modules/user-action-logs/application/use-cases/`
- `src/modules/user-action-logs/domain/ports/user-action-log-query.port.ts`
- `src/modules/user-action-logs/infrastructure/adapters/prisma-user-action-log-query.adapter.ts`
- `src/modules/user-action-logs/presentation/graphql/inputs/`
- `src/modules/user-action-logs/presentation/graphql/types/`
- `src/modules/user-action-logs/presentation/graphql/resolvers/user-action-logs.resolver.ts`
- `src/schema.gql`

Dependencias relevantes:

- NestJS GraphQL code-first
- Prisma/PostgreSQL para agregaciones
- guards/roles ya existentes para `ADMIN` y `EMPLOYEE`