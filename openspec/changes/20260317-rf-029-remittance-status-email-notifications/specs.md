# Specs: rf-029-remittance-status-email-notifications

## Specs status

ALL ACCEPTANCE CRITERIA COMPLETED

## Requirement

Implementar notificaciones por email para cambios relevantes de estado de remesa (RF-029), preservando comportamiento actual del lifecycle.

## Acceptance criteria

### AC-1: markRemittancePaid triggers notification - ✔ Cumplido

- Dado una remesa en estado válido para `markRemittancePaid`.
- Cuando la transición se completa exitosamente.
- Entonces se debe intentar enviar email al usuario dueño de la remesa.
- Y la operación principal debe mantenerse exitosa.
- Evidencia: validado manualmente con smtp4dev.

### AC-2: adminConfirmRemittancePayment triggers notification - ✔ Cumplido

- Dado una remesa en estado válido para `adminConfirmRemittancePayment`.
- Cuando la transición se completa exitosamente.
- Entonces se debe intentar enviar email al usuario dueño de la remesa.
- Y la operación principal debe mantenerse exitosa.
- Evidencia: validado manualmente con smtp4dev.

### AC-3: adminMarkRemittanceDelivered triggers notification - ✔ Cumplido

- Dado una remesa en estado válido para `adminMarkRemittanceDelivered`.
- Cuando la transición se completa exitosamente.
- Entonces se debe intentar enviar email al usuario dueño de la remesa.
- Y la operación principal debe mantenerse exitosa.
- Evidencia: validado manualmente con smtp4dev.

### AC-4: cancelMyRemittance triggers notification - ✔ Cumplido

- Dado una remesa en estado válido para `cancelMyRemittance`.
- Cuando la transición se completa exitosamente.
- Entonces se debe intentar enviar email al usuario dueño de la remesa.
- Y la operación principal debe mantenerse exitosa.
- Evidencia: validado manualmente con smtp4dev.

### AC-5: adminCancelRemittance triggers notification - ✔ Cumplido

- Dado una remesa en estado cancelable por admin.
- Cuando `adminCancelRemittance` se completa exitosamente.
- Entonces se debe intentar enviar email al usuario dueño de la remesa.
- Y la operación principal debe mantenerse exitosa.
- Evidencia: validado manualmente con smtp4dev.

### AC-6: Email failure is non-blocking - ✔ Cumplido

- Dado que ocurre un error en el envío de email en cualquiera de los eventos anteriores.
- Cuando la transición de estado ya fue persistida correctamente.
- Entonces la mutación o use case NO debe fallar por ese error de email.
- Y el estado de remesa NO debe revertirse.
- Evidencia: comportamiento best-effort validado; warning no bloqueante registrado.

### AC-7: GraphQL and Prisma contracts remain unchanged - ✔ Cumplido

- Para este cambio no se agregan ni modifican:
  - tipos, queries, mutations o inputs GraphQL,
  - modelos, campos o migraciones Prisma.
- Evidencia: build y start:dev OK, schema.gql sin cambios, Prisma sin cambios.

### AC-8: No notification on failed transition - ✔ Cumplido

- Dado que una transición falla por validación o regla de negocio actual.
- Cuando el nuevo estado no llega a persistirse.
- Entonces no se debe intentar enviar email asociado a esa transición fallida.
- Evidencia: validación manual de flujo sin persistencia exitosa.

## Functional notes

- Las notificaciones se consideran comportamiento complementario del lifecycle existente.
- El destinatario siempre debe ser el owner real de la remesa.
- La implementación no debe alterar las reglas actuales de transición.

## Non-functional constraints

- Envío síncrono best-effort en V1 (sin colas).
- Sin retry automático.
- Sin persistencia de historial de emails.
- Sin template engine ni multilenguaje.
- Sin cambios de semántica de lifecycle existente.
- Sin cambios GraphQL.
- Sin cambios Prisma.