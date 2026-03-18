# Design: rf-029-remittance-status-email-notifications

## Design status

IMPLEMENTED AS DESIGNED

## Deviation status

No deviations.

## Architecture overview (additive)

El diseño es aditivo y contract-safe:

- Se incorpora un puerto dedicado de notificación de estado de remesa en la capa de puertos.
- Se implementa un adapter de infraestructura que usa la capacidad de email existente.
- Se integra la invocación en puntos de transición ya exitosos del lifecycle de remesas.

Estado final de implementación:

- Puerto dedicado implementado para notificaciones de estado de remesa.
- Adapter de infraestructura implementado y conectado por DI.
- Reutilización de infraestructura de correo existente confirmada.

No se modifica:

- semántica de estados,
- reglas de transición,
- contratos GraphQL,
- esquema Prisma.

## Trigger points in lifecycle

Las notificaciones se disparan solo después de completar exitosamente la transición de estado correspondiente:

- `markRemittancePaid`
- `adminConfirmRemittancePayment`
- `adminMarkRemittanceDelivered`
- `cancelMyRemittance`
- `adminCancelRemittance`

Secuencia lógica esperada:

1. Validar reglas de negocio actuales.
2. Persistir exitosamente la transición de estado actual.
3. Intentar la notificación best-effort.
4. Retornar el resultado actual de la operación sin depender del envío.

Confirmación de ejecución:

- Las notificaciones se ejecutan después de persistencia exitosa.
- No se notifica cuando la transición falla antes de persistir.

## Required data for notification

Cada notificación debe enviarse al owner real de la remesa, usando el email del usuario asociado a la remesa.

La implementación no debe inferir destinatarios desde:

- beneficiary,
- recipient snapshot,
- administradores.

Datos mínimos esperados para construir el email:

- identificador de remesa,
- email del owner,
- nombre visible del owner si está disponible,
- estado o evento relevante resultante,
- información mínima contextual útil para el mensaje.

Confirmación de implementación:

- Destinatario final: owner real de la remesa (`senderUser.email`).
- Payload observado: remittanceId, status resultante, event y statusDescription cuando aplica.

## Best-effort failure strategy

Regla obligatoria:

- si el envío de email falla, la operación principal no falla ni se revierte.

Comportamiento esperado en fallo de envío:

- la remesa conserva su nuevo estado persistido,
- la mutación o use case mantiene resultado exitoso,
- el fallo se registra como no bloqueante para observabilidad.

Confirmación de comportamiento validado:

- Estrategia best-effort aplicada y validada en pruebas manuales.

## Data and contract impact

### Prisma

Sin cambios en modelos, campos o migraciones.

### GraphQL code-first

Sin cambios en:

- queries,
- mutations,
- types,
- inputs.

Validación obligatoria del contrato existente:

1. `npm run build`
2. `PORT=3001 npm run start:dev`
3. verificar `src/schema.gql` sin cambios funcionales por este feature.

Resultado de validación:

- build OK,
- start:dev OK,
- schema.gql sin cambios.

## Clean architecture alignment

- Puerto de notificación aislado en dominio o aplicación de remesas.
- Adapter de infraestructura desacoplado de reglas de lifecycle.
- Integración mínima en use case existente, sin refactor general.
- Dependencias dirigidas por puertos (hexagonal) y una sola responsabilidad por componente (SOLID).

## Dependency strategy

La implementación debe reutilizar la infraestructura de correo existente con la mínima extensión necesaria.

Esto implica:

- no duplicar infraestructura SMTP,
- no introducir un segundo sistema de correo paralelo,
- extender la capacidad actual solo en lo mínimo necesario para soportar emails de estado de remesa.

Resultado:

- Estrategia respetada sin cambios de diseño.

## Non-goals of design

Este diseño no contempla:

- scheduler,
- cola de eventos,
- outbox,
- persistencia de auditoría de emails,
- plantillas avanzadas,
- cambios en enums o representación de estados,
- cambios de UX o frontend.

Confirmación:

- Ningún non-goal fue implementado.