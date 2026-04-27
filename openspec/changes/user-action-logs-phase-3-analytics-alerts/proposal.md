# Proposal: user-action-logs-phase-3-analytics-alerts

## Change status

PROPOSED

## Why

`UserActionLogs` ya resuelve auditoria funcional y reporting administrativo base, pero el frontend todavia necesita coordinar multiples queries para construir un dashboard util y el backend no tiene una capa minima para detectar patrones sospechosos ni correlacionar acciones de negocio relacionadas.

La siguiente iteracion debe resolver solo el minimo viable de esas necesidades, sin abrir nuevos modulos, sin cron, sin workers y sin intentar convertir auditoria operacional en una plataforma analitica completa.

## Problem

El estado actual deja cuatro huecos concretos:

- frontend administrativo necesita varias llamadas para renderizar una vista unificada,
- no existe un concepto persistido de alerta basica cuando un patron sospechoso supera thresholds simples,
- los logs actuales no incluyen `correlationId`, lo que dificulta seguir el lifecycle de una remesa u otra entidad de negocio,
- BI todavia no tiene una base explicitamente documentada o una superficie minima gobernada para consumo futuro.

## What Changes

- agregar `adminUserActionLogDashboard(input): UserActionLogDashboard!` como query unificada que compone `summary`, `activityByDay`, `topActors`, `topActions` y `recentCriticalActions`,
- agregar el modelo minimo `UserActionAlert` con generacion inline y non-blocking para thresholds basicos de comportamiento sospechoso,
- extender `UserActionLog` con `correlationId` nullable para agrupar acciones relacionadas de negocio,
- dejar preparada la base de BI mediante documentacion de tablas y, como opcion minima, una vista SQL simple de solo lectura,
- mantener toda la implementacion dentro del modulo existente `user-action-logs`, reutilizando use cases, query ports y adapters ya presentes.

## Scope

Dentro de alcance en este MVP de fase 3:

- `adminUserActionLogDashboard(input): UserActionLogDashboard!`,
- use case `admin-user-action-log-dashboard.usecase.ts`,
- use case `detect-user-action-alert.usecase.ts`,
- modelo Prisma minimo `UserActionAlert`,
- campo `correlationId` opcional en `UserActionLog`,
- integracion inline y non-blocking de deteccion de alertas sobre flujos ya auditados,
- documentacion BI y vista SQL simple opcional si aporta valor sin complicar la entrega.

## Out of scope

Fuera de alcance en esta iteracion:

- export programado,
- PDF,
- alertas avanzadas,
- cron jobs,
- workers,
- websockets,
- dashboards frontend,
- nuevos modulos independientes para alertas o exports,
- recalcular reporting existente desde cero,
- queries sin limites o sin filtros acotados.

## Capabilities

### New Capabilities

- `user-action-log-dashboard`: dashboard administrativo unificado en una sola query, construido sobre agregaciones ya existentes y una lista acotada de acciones criticas recientes.
- `user-action-log-alerting`: deteccion basica de thresholds sospechosos con persistencia inline y non-blocking dentro del modulo actual.
- `user-action-log-business-correlation`: correlacion opcional de logs mediante `correlationId` y metadata segura de negocio.
- `user-action-log-bi-readiness`: readiness minima para BI mediante documentacion de la superficie de datos y una vista SQL simple opcional.

### Modified Capabilities

- None.

## Risks

- Riesgo de sobreingenieria si dashboard y alertas intentan resolver mas casos que el MVP definido.
- Riesgo de duplicacion si el dashboard vuelve a implementar agregaciones que ya existen en fase 2.
- Riesgo de falsos positivos si los thresholds iniciales de alertas se definen sin limites conservadores.
- Riesgo de performance si `recentCriticalActions` o alert detection operan sin filtros temporales y topes explicitos.
- Riesgo de contaminar metadata si `correlationId` se acompana de payloads de negocio demasiado ricos.

## Impact

Superficie impactada prevista:

- `src/modules/user-action-logs/application/use-cases/`
- `src/modules/user-action-logs/domain/ports/`
- `src/modules/user-action-logs/infrastructure/adapters/`
- `src/modules/user-action-logs/presentation/graphql/`
- Prisma schema y migracion SQL aditiva
- `src/schema.gql`
- documentacion BI o vista SQL simple

Dependencias y sistemas afectados:

- NestJS GraphQL code-first
- Prisma/PostgreSQL
- guards y roles administrativos ya existentes
- flujos ya auditados de auth, remittances y acciones admin sensibles

## Compatibility

La propuesta es aditiva y segura:

- no cambia contratos existentes de fase 1 ni fase 2,
- no elimina queries ya disponibles,
- no vuelve blocking el logging,
- no introduce infraestructura nueva de ejecucion asincrona,
- mantiene cambios pequenos y progresivos dentro del modulo actual.