# Tasks: user-action-logs-audit-trail

## Tasks status

IN PROGRESS

## 1. Discovery read-only

- [x] Revisar flujos existentes de auth, users, remittances, vip payment proofs y support messages.
- [x] Identificar puntos exactos de éxito funcional donde conviene registrar auditoría.
- [x] Confirmar restricciones actuales de auth, roles, DI tokens y GraphQL code-first.

## 2. Prisma schema and migration

- [x] Agregar modelo `UserActionLog` al schema Prisma.
- [x] Agregar enum `UserActionLogAction`.
- [x] Definir índices.
- [x] Declarar relación explícita `UserActionLogActor` y back-reference dedicado en `User` para evitar ambigüedad.
- [x] Generar migración sin alterar contratos existentes.

## 3. GraphQL enum

- [x] Exponer enum GraphQL para `UserActionLogAction`.
- [x] Verificar que el enum cubre todas las acciones de fase 1 sin ampliar alcance.
- [x] Confirmar compatibilidad con code-first y schema generado.

## 4. Domain ports and entities

- [x] Crear puerto `user-action-log-command.port.ts`.
- [x] Crear puerto `user-action-log-query.port.ts`.
- [x] Definir contratos de entrada y salida alineados al dominio.

## 5. Use cases

- [x] Implementar `record-user-action-log.usecase.ts`.
- [x] Implementar `my-user-action-logs.usecase.ts`.
- [x] Implementar `admin-user-action-logs.usecase.ts`.
- [x] Incorporar reglas de autorización y filtrado requeridas.

## 6. Prisma adapters

- [x] Implementar `prisma-user-action-log-command.adapter.ts`.
- [x] Implementar `prisma-user-action-log-query.adapter.ts`.
- [x] Asegurar mapping consistente entre dominio, Prisma y GraphQL.

## 7. GraphQL types, inputs and resolver

- [x] Crear type `UserActionLog`.
- [x] Crear `UserActionLogListInput`.
- [x] Crear `AdminUserActionLogListInput`.
- [x] Implementar `user-action-logs.resolver.ts`.
- [x] Asegurar seguridad de `myUserActionLogs` y `adminUserActionLogs`.

## 8. DI tokens and module wiring

- [x] Agregar tokens necesarios en `src/shared/constants/tokens.ts`.
- [x] Registrar providers del módulo `user-action-logs`.
- [x] Registrar el módulo en `src/app.module.ts`.

## 9. Metadata sanitization

- [x] Definir helper o estrategia común para sanitizar `metadataJson`.
- [x] Garantizar exclusión de passwords, tokens, base64, S3 keys, imágenes, documentos y datos bancarios completos.
- [x] Garantizar que `cancelMyRemittance` y `adminCancelRemittance` distinguen origen solo con metadata segura.
- [x] Validar que cada integración manual construye metadata mínima segura.

## 10. Non-blocking registration wiring

- [x] Integrar registro non-blocking en `register`.
- [x] Integrar registro non-blocking en `login`.
- [x] Integrar registro non-blocking en `logout`.
- [x] Integrar registro non-blocking en `updateMyProfile`.
- [x] Integrar registro non-blocking en `adminUpdateUserProfile`.
- [x] Integrar registro non-blocking en `adminSetUserVip`.
- [x] Integrar registro non-blocking en `submitRemittanceV2`.
- [x] Integrar registro non-blocking en `markRemittancePaid`.
- [x] Integrar registro non-blocking en `adminConfirmRemittancePayment`.
- [x] Integrar registro non-blocking en `adminMarkRemittanceDelivered`.
- [x] Integrar registro non-blocking en `cancelMyRemittance`.
- [x] Integrar registro non-blocking en `adminCancelRemittance`.
- [x] Integrar registro non-blocking en `createVipPaymentProof`.
- [x] Integrar registro non-blocking en `adminConfirmVipPaymentProof`.
- [x] Integrar registro non-blocking en `adminCancelVipPaymentProof`.
- [x] Integrar registro non-blocking en `createSupportMessage`.
- [x] Integrar registro non-blocking en `answerSupportMessage`.

- [x] Asegurar patrón obligatorio `try/await/catch logger.warn(...)` en todas las integraciones de fase 1.

## 11. Regenerar schema

- [x] Regenerar artefactos GraphQL code-first requeridos.
- [x] Verificar `src/schema.gql` con el nuevo contrato aditivo.

## 12. Build

- [x] Ejecutar `npm run build`.
- [x] Corregir errores de tipado o wiring del módulo nuevo.

## 13. Smoke tests

- [ ] Validar consultas `myUserActionLogs` y `adminUserActionLogs`.
- [ ] Validar cobertura de acciones de auth y user management de fase 1.
- [ ] Validar acciones auditadas de auth, users, remittances, vip payment proofs y support.
- [ ] Validar fallo non-blocking cuando la persistencia del log falla.
- [ ] Validar ausencia de datos sensibles en `metadataJson`.

## 14. Manual validation

- [x] Revisar shape final del contrato GraphQL.
- [x] Revisar migración Prisma generada.
- [x] Revisar que el alcance siga siendo fase 1 solamente, sin export/reporting, sin interceptor global y sin logging técnico.
- [ ] Revisar ejemplos representativos de logs persistidos.
- [x] Confirmar ausencia de cambios breaking y de refactors fuera de alcance.
