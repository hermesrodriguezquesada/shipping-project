# Proposal: user-action-logs-advanced-analytics-and-integrations

## Change status

PROPOSED

## Why

La fase 1 de `UserActionLogs` ya cubre el registro non-blocking y las consultas base, y la fase 2 ya agrega reporting administrativo y exportacion CSV on-demand. Sin embargo, el sistema todavia no resuelve tres necesidades operativas de la siguiente etapa: consumo frontend en una sola llamada, deteccion de comportamiento sospechoso y exposicion controlada para consumo externo y analitica transversal.

Abrir esta fase ahora permite reutilizar la base ya construida antes de que el volumen de eventos y necesidades de compliance obliguen a introducir soluciones ad hoc en frontend, jobs aislados o consultas manuales sobre tablas operativas.

## Problem

Hoy `UserActionLogs` sirve para auditoria y reporting puntual, pero no ofrece una capa avanzada para analitica operacional y consumo externo. En particular:

- el frontend administrativo tendria que orquestar multiples queries para construir un dashboard coherente,
- no existe un concepto persistido de alerta sobre actividad sospechosa o sensible,
- no hay exportaciones programadas con filtros reutilizables,
- BI externo no tiene una superficie oficialmente gobernada para consultar auditoria sin pegarse a tablas crudas,
- los logs actuales no tienen `correlationId`, lo que limita seguir una entidad de negocio como una remesa a traves de multiples acciones.

## Motivation

Se necesita una fase 3 que amplie el modulo de auditoria sin reescribir fases anteriores, manteniendo los principios ya aprobados:

- cambios aditivos y compatibles hacia atras,
- logging non-blocking,
- separacion read/write,
- adapters Prisma y DI por tokens,
- queries acotadas y seguras para `ADMIN` y `EMPLOYEE`.

La motivacion tecnica es consolidar agregaciones y analitica en el backend, no en clientes. La motivacion operativa es poder detectar patrones sospechosos, programar exportes recurrentes y habilitar dashboards y BI con menor esfuerzo manual.

## Business value

Esta fase agrega valor de negocio en cuatro frentes:

- reduce tiempo operativo para soporte, compliance y supervision administrativa con un dashboard listo para consumir,
- mejora deteccion temprana de comportamientos anormales sin bloquear flujos criticos del negocio,
- habilita automatizacion de reportes recurrentes para auditoria y operaciones,
- permite correlacionar actividad de usuario con entidades de negocio, especialmente remesas, para investigacion y trazabilidad end-to-end.

## What Changes

- agregar una query `adminUserActionLogDashboard(input)` que entregue un bundle frontend-ready con `summary`, `activityByDay`, `topActors`, `topActions` y `recentCriticalActions`, reutilizando la logica de reporting existente sin duplicarla,
- introducir el concepto `UserActionAlert` con generacion asincrona, persistida y no bloqueante para reglas iniciales de comportamiento sospechoso,
- introducir el concepto `UserActionLogExportSchedule` para exportacion CSV automatica con frecuencia `daily` o `weekly` y filtros configurables,
- definir una superficie de consumo BI sin duplicar datos, basada en vistas SQL o acceso controlado de solo lectura sobre el mismo modelo operativo,
- extender `UserActionLog` con `correlationId` y metadata enriquecida para correlacion con entidades de negocio como `Remittance`.

## Scope

Dentro de alcance en esta fase 3:

- query agregada `adminUserActionLogDashboard(input): UserActionLogDashboard!`,
- nuevo modulo `user-action-alerts` para persistencia y consulta administrativa de alertas,
- nuevo modulo `user-action-log-exports` para configuracion y ejecucion de exportes programados,
- extension del modelo de logs con `correlationId` y metadata de correlacion de negocio,
- estrategia documentada y gobernada para acceso BI sin duplicacion de datos,
- autorizacion administrativa para dashboard, alertas y schedules en `ADMIN` y `EMPLOYEE`,
- cambios minimos y progresivos sobre la base existente de fases 1 y 2.

## Out of scope

Fuera de alcance en esta fase:

- machine learning o scoring predictivo,
- bloqueo automatico de usuarios o acciones,
- realtime websockets,
- notificaciones push,
- UI frontend,
- reemplazar queries existentes de fase 1 o fase 2,
- duplicar pipelines de datos o replicar `UserActionLog` en otra tabla analitica,
- side effects blocking en el flujo principal de negocio.

## Capabilities

### New Capabilities

- `user-action-log-dashboard`: dashboard administrativo frontend-ready en una sola llamada, reutilizando las agregaciones existentes y agregando acciones criticas recientes.
- `user-action-log-alerting`: deteccion asincrona y persistencia de alertas de comportamiento sospechoso o actividad administrativa sensible.
- `user-action-log-export-scheduling`: programacion de exportes CSV recurrentes con filtros configurables y ejecucion desacoplada.
- `user-action-log-bi-access`: exposicion controlada de datos de auditoria para herramientas BI sin duplicacion de datos.
- `user-action-log-business-correlation`: correlacion funcional entre logs y entidades de negocio mediante `correlationId` y metadata enriquecida.

### Modified Capabilities

- None.

## Risks

- Riesgo de consultas pesadas si la query de dashboard o las vistas BI no quedan limitadas por rango, topes e indices.
- Riesgo de ruido operativo si las reglas iniciales de alertas son demasiado agresivas y generan falsos positivos.
- Riesgo de complejidad accidental si el scheduler de exportes introduce otra fuente de verdad distinta al export on-demand de fase 2.
- Riesgo de exponer metadata de negocio mayor a la necesaria si la correlacion no se limita a identificadores y estados seguros.
- Riesgo de acoplar BI a tablas internas si no se define claramente una superficie gobernada y estable.

## Impact

Superficie impactada prevista:

- `src/modules/user-action-logs/` para dashboard y correlacion,
- `src/modules/user-action-alerts/` como modulo nuevo,
- `src/modules/user-action-log-exports/` como modulo nuevo,
- schema Prisma y migraciones PostgreSQL,
- `src/schema.gql`, inputs, types y resolvers GraphQL code-first,
- scheduler interno para ejecucion de exportes,
- vistas SQL o documentacion de acceso BI.

Dependencias y sistemas afectados:

- NestJS GraphQL code-first,
- Prisma/PostgreSQL,
- mecanismos existentes de auth/roles para `ADMIN` y `EMPLOYEE`,
- consumers administrativos y herramientas BI como Metabase.

## Compatibility

La propuesta es aditiva y compatible hacia atras:

- no elimina ni cambia el contrato de `myUserActionLogs` ni `adminUserActionLogs`,
- no reemplaza las queries agregadas de fase 2; las reutiliza y compone,
- no vuelve blocking el registro de logs,
- no introduce cambios obligatorios para frontend existente,
- mantiene a `UserActionLogs` como fuente primaria de auditoria funcional.