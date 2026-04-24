# Proposal: user-action-logs-audit-trail

## Change status

PROPOSED

## Problem

El backend no tiene un mecanismo transversal y consistente para auditar acciones relevantes de usuarios y administradores. Hoy existen flujos críticos en auth, users, remittances, vip payment proofs y support messages, pero no hay un historial consultable que permita responder de forma confiable:

- quién ejecutó una acción,
- sobre qué recurso se ejecutó,
- cuándo ocurrió,
- desde qué contexto técnico básico ocurrió.

Esto limita trazabilidad operativa, soporte interno, investigación de incidentes y revisión de acciones administrativas.

## Motivation

Se necesita una base de auditoría funcional mínima que:

- sea transversal y reutilizable,
- no rompa contratos existentes,
- no introduzca bloqueo en flujos de negocio,
- respete restricciones de seguridad y privacidad,
- quede alineada con la arquitectura hexagonal y DI por tokens del proyecto.

También se necesita exponer consultas GraphQL seguras para que cada usuario vea su propio historial y para que ADMIN o EMPLOYEE pueda consultar logs globales con filtros.

## Proposed solution

Agregar un nuevo módulo `user-action-logs` con persistencia en PostgreSQL vía Prisma, contrato GraphQL code-first y puertos hexagonales para comandos y consultas.

El módulo introduce la entidad `UserActionLog` y el enum `UserActionLogAction`, con una primera fase de registro explícito en use cases ya existentes para acciones relevantes de:

- register, login, logout,
- updateMyProfile, adminUpdateUserProfile, adminSetUserVip,
- submitRemittanceV2, markRemittancePaid, adminConfirmRemittancePayment, adminMarkRemittanceDelivered, cancelMyRemittance, adminCancelRemittance,
- createVipPaymentProof, adminConfirmVipPaymentProof, adminCancelVipPaymentProof,
- createSupportMessage, answerSupportMessage.

El registro será best-effort y non-blocking. Si guardar el log falla, la acción principal debe completar normalmente y solo dejar observabilidad por warning.

## Scope

Dentro de alcance en esta fase 1 solamente:

- nuevo modelo Prisma `UserActionLog` y enum `UserActionLogAction`,
- nuevo módulo `src/modules/user-action-logs/`,
- puertos de dominio para escritura y lectura,
- use cases para registrar logs y consultar logs propios o globales,
- adapters Prisma para persistencia y query,
- tipos, inputs y resolver GraphQL code-first,
- wiring por tokens DI y registro en `app.module.ts`,
- integración explícita non-blocking en los use cases o resolvers existentes definidos en esta fase,
- sanitización de `metadataJson` para evitar secretos o payloads sensibles.

## Out of scope

Fuera de alcance en esta fase:

- exportación o reporting de auditoría,
- interceptor global o solución automática transversal,
- logging técnico como mecanismo principal de auditoría funcional,
- colas, outbox, retries o procesamiento asíncrono diferido,
- almacenamiento de payloads completos de requests o responses,
- versionado histórico de entidades,
- cambios breaking en contratos existentes,
- cambios de frontend,
- trazas técnicas de infraestructura o observabilidad general fuera del módulo.

## Risks

- Riesgo de registrar metadata sensible si los puntos de integración no sanitizan correctamente.
- Riesgo de duplicación o inconsistencia si la instrumentación manual no se aplica de forma uniforme.
- Riesgo de crecimiento rápido del volumen de logs sin política de retención en futuras fases.
- Riesgo de dependencia accidental del logging dentro del flujo de negocio si no se mantiene el patrón non-blocking.

## Compatibility

La propuesta es aditiva y compatible hacia atrás:

- no reemplaza mutations ni queries existentes,
- no cambia contratos GraphQL actuales de los flujos ya implementados,
- no altera semántica de negocio existente,
- no convierte el logging en dependencia obligatoria para completar acciones.

El único contrato nuevo será la exposición de queries y tipos de auditoría, sin romper consumidores actuales.
