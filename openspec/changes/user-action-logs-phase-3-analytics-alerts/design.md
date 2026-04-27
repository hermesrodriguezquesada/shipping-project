# Design: user-action-logs-phase-3-analytics-alerts

## Design status

PROPOSED

## Context

El modulo `user-action-logs` ya existe y hoy contiene:

- escritura non-blocking de logs de auditoria,
- queries base `myUserActionLogs` y `adminUserActionLogs`,
- reporting administrativo con `summary`, `activityByDay`, `topActors`, `topActions`,
- export CSV on-demand.

La fase 3 MVP debe extender esa base sin abrir modulos nuevos y sin introducir infraestructura adicional. El objetivo no es construir una plataforma completa de analitica ni un motor de alertas sofisticado, sino resolver cuatro capacidades puntuales con el menor cambio posible:

- dashboard unificado para frontend,
- alertas basicas inline,
- `correlationId` opcional,
- BI readiness minima.

Restricciones de diseno:

- todo debe seguir siendo non-blocking,
- no se debe duplicar logica ya implementada en fase 2,
- cualquier lectura nueva debe estar acotada por rango o limites,
- no se crean cron jobs, workers ni modulos nuevos,
- el modulo `user-action-logs` sigue siendo la unica superficie funcional de esta fase.

## Goals / Non-Goals

**Goals:**

- exponer un dashboard administrativo en una sola query reutilizando reporting existente,
- detectar thresholds basicos de actividad sospechosa de forma inline y best-effort,
- agregar `correlationId` sin romper logs historicos ni contratos actuales,
- dejar una base minima para BI sin implementar integraciones reales,
- mantener la entrega pequena, incremental y segura.

**Non-Goals:**

- cron o scheduling,
- workers externos o colas,
- alertas complejas con lifecycle, severity o resolucion,
- export programado,
- PDF,
- UI frontend,
- read models nuevos o tablas duplicadas para analitica,
- refactor masivo del modulo actual.

## Decisions

### 1. Dashboard como composicion de use cases existentes

Se agregara `admin-user-action-log-dashboard.usecase.ts` dentro de `src/modules/user-action-logs/application/use-cases/`.

La query `adminUserActionLogDashboard(input)` devolvera:

- `summary`
- `activityByDay`
- `topActors`
- `topActions`
- `recentCriticalActions`

Decision:

- reutilizar `admin-user-action-log-summary.usecase.ts`, `admin-user-action-log-activity-by-day.usecase.ts`, `admin-user-action-log-top-actors.usecase.ts` y `admin-user-action-log-top-actions.usecase.ts`,
- agregar solo una lectura nueva para `recentCriticalActions`,
- compartir el mismo filtro administrativo base ya usado por reporting,
- aplicar limites internos fijos o validados para `topActors`, `topActions` y `recentCriticalActions`.

Rationale:

- evita recalculo duplicado,
- reduce riesgo de inconsistencias entre queries de fase 2 y dashboard,
- mantiene el cambio pequeno y centrado en composicion, no en nuevos algoritmos.

Alternativas consideradas:

- recalcular todo desde una query unica nueva en el adapter: descartado por duplicacion innecesaria,
- pedir que frontend siga llamando multiples queries: descartado porque justamente no resuelve el problema del consumo unificado.

### 2. `recentCriticalActions` como consulta limitada sobre acciones sensibles existentes

`recentCriticalActions` se construira como una lectura acotada sobre `UserActionLog` filtrando un set pequeno de acciones sensibles ya conocidas, por ejemplo:

- `LOGIN`
- `CANCEL_REMITTANCE`
- acciones admin sensibles ya auditadas en el sistema

Decision:

- usar filtros temporales obligatorios o inferidos desde el input del dashboard,
- imponer un limite pequeno por defecto,
- no crear una tabla nueva ni una agregacion materializada para esta lista.

Rationale:

- el frontend solo necesita un feed corto de eventos recientes,
- una consulta directa y limitada es suficiente para el MVP,
- evita otra superficie de almacenamiento o sincronizacion.

### 3. Alert detection inline, desacoplado por `try/catch`, no por infraestructura externa

Se agregara `detect-user-action-alert.usecase.ts` dentro del mismo modulo `user-action-logs`.

Modelo minimo:

```prisma
model UserActionAlert {
  id           String   @id @default(uuid())
  type         String
  actorUserId  String?
  description  String
  metadataJson String?
  createdAt    DateTime @default(now())
}
```

Decision:

- ejecutar la deteccion de alertas inline despues del registro del log o inmediatamente despues del flujo auditado,
- envolver la deteccion en `try/catch` y degradar cualquier error a warning,
- persistir solo el modelo minimo sin `resolvedAt` ni severidades complejas,
- evaluar thresholds simples con ventanas acotadas usando consultas limitadas por actor, accion y rango reciente.

Casos MVP:

- mas de 5 `LOGIN` en 5 minutos del mismo usuario,
- mas de 3 `CANCEL_REMITTANCE` en ventana corta del mismo actor,
- mas de X acciones admin sensibles en ventana corta.

Rationale:

- respeta la regla de no usar cron ni workers,
- mantiene bajo el costo operacional,
- permite probar valor real antes de introducir un motor mas sofisticado.

Alternativas consideradas:

- modulo independiente de alertas: descartado por sobreingenieria en esta iteracion,
- deteccion por cron: descartado porque esta fuera de alcance,
- detectar todo dentro de cada resolver: descartado por mayor duplicacion y menor control.

### 4. `correlationId` nullable y opcional en `UserActionLog`

Se extendera `UserActionLog` con un campo `correlationId` nullable.

Decision:

- no exigir `correlationId` en todos los logs,
- poblarlo solo en flujos donde exista una correlacion clara, empezando por remittances,
- mantener metadata segura y pequena, con identificadores o estados relevantes solamente,
- asegurar que queries y mappers actuales sigan funcionando con registros viejos sin ese campo.

Rationale:

- habilita trazabilidad de negocio sin migraciones complejas de comportamiento,
- mantiene compatibilidad hacia atras,
- evita convertir el log en snapshot detallado de entidades.

Alternativas consideradas:

- volver obligatorio `correlationId` en todo write path: descartado por alto costo y poca utilidad inmediata,
- resolver correlacion solo por metadata libre: descartado porque un campo dedicado es mas estable y consultable.

### 5. BI readiness solo documental, con vista simple opcional

Decision:

- no implementar integracion real con Metabase ni otro BI en esta fase,
- documentar que `UserActionLog` y `UserActionAlert` son consumibles para BI,
- opcionalmente agregar una vista SQL simple y estable si aporta claridad sin aumentar complejidad,
- no duplicar datos ni crear pipelines adicionales.

Rationale:

- satisface el objetivo de preparacion sin abrir otro frente tecnico,
- evita acoplar esta iteracion a decisiones de infraestructura externa,
- mantiene foco en el MVP del backend.

Alternativas consideradas:

- exponer endpoints dedicados para BI desde ahora: descartado por ser mas trabajo que valor en esta fase,
- crear replica o esquema analitico separado: descartado por sobredimensionado.

## Performance and limits

Para mantener el cambio seguro:

- dashboard debe reutilizar filtros administrativos existentes,
- `activityByDay` se limita a ventanas razonables de 7 a 30 dias,
- `topActors` y `topActions` deben tener `limit` con maximo,
- `recentCriticalActions` debe tener `limit` pequeno y orden por recencia,
- alert detection consulta solo ventanas recientes y por actor, nunca historicos abiertos,
- `correlationId` debe indexarse si se va a consultar administrativamente.

## Risks / Trade-offs

- [Dashboard demasiado costoso] -> Mitigar componiendo use cases existentes y limitando los segmentos variables.
- [Falsos positivos de alertas] -> Mitigar con thresholds conservadores y modelo minimo sin automatizaciones adicionales.
- [Acoplamiento de alert detection al write path] -> Mitigar manteniendo la ejecucion best-effort y envuelta en `try/catch`.
- [Regresion en logs existentes por `correlationId`] -> Mitigar haciendo el campo nullable y manteniendo mappers compatibles con registros historicos.
- [BI readiness vacia o ambigua] -> Mitigar dejando documentacion concreta y, solo si aporta valor neto, una vista SQL simple.

## Migration Plan

1. Extender Prisma con `UserActionAlert` y `correlationId` nullable en `UserActionLog`.
2. Agregar indices minimos sobre consultas de alert detection y correlacion.
3. Extender query port y adapter solo en lo necesario para dashboard y acciones criticas recientes.
4. Crear el use case de dashboard como composicion de reporting existente.
5. Crear el use case de deteccion de alertas y conectarlo inline con el flujo de logging seguro.
6. Exponer contrato GraphQL aditivo y regenerar schema.
7. Validar build y smoke tests para asegurar que fases 1 y 2 siguen intactas.

Rollback:

- desregistrar la nueva query y wiring de alert detection,
- dejar sin uso las columnas/tablas aditivas hasta migracion correctiva posterior si fuera necesaria.

## Open Questions

- que acciones exactas entran en el set inicial de “acciones admin sensibles”,
- cual es el umbral inicial de `X` para acciones admin sensibles,
- si conviene exponer `UserActionAlert` por GraphQL en esta misma iteracion o dejar solo persistencia y uso interno,
- si la vista SQL simple de BI aporta valor inmediato o conviene dejar solo documentacion en esta fase.