# Proposal: rf-029-remittance-status-email-notifications

## Change status

COMPLETED

## Problem resolution

La brecha de RF-029 quedó resuelta. El backend ahora intenta enviar notificación por email al owner real de la remesa cuando ocurren transiciones relevantes del lifecycle ya existente.

## Implemented scope (completed)

Eventos cubiertos en producción del change:

- markRemittancePaid
- adminConfirmRemittancePayment
- adminMarkRemittanceDelivered
- cancelMyRemittance
- adminCancelRemittance

Comportamiento aplicado:

- envío best-effort no bloqueante,
- si falla email no se revierte la transición,
- la mutación principal mantiene éxito,
- warning no bloqueante para observabilidad.

## Validation evidence summary

- ✔ Emails enviados correctamente en smtp4dev para los 5 eventos.
- ✔ Destinatario validado: senderUser.email (owner real de la remesa).
- ✔ Contenido validado: remittanceId, status resultante, event, statusDescription cuando aplica.
- ✔ Falla de email no bloquea ni revierte transición.
- ✔ npm run build OK.
- ✔ PORT=3001 npm run start:dev OK.
- ✔ src/schema.gql sin cambios.
- ✔ Sin cambios en Prisma schema.

## Out of scope confirmation

Se respetó íntegramente el alcance definido:

- RF-024, RF-025, RF-026, RF-027, RF-028 y RF-030 no fueron modificados.
- Sin cambios de contrato GraphQL.
- Sin cambios de esquema o migraciones Prisma.
- Sin colas, retries, persistencia de historial, template engine o multilenguaje.
- Sin refactors fuera de alcance.