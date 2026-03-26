# Tasks: canonical-origin-account-model

## 1. Scope lock and architecture baseline

- [x] Confirmar baseline técnico del discovery en input, validación, persistencia y output.
- [x] Registrar explícitamente que este change reemplaza enfoques parciales previos.
- [x] Asegurar guardrails de alcance: solo origin account.

## 2. Introduce JSON support in GraphQL

- [x] Introducir scalar `JSON` en GraphQL.
- [x] Confirmar que puede usarse en input y output del bloque canónico `originAccount`.

## 3. Redesign canonical input

- [x] Redefinir `SubmitRemittanceV2OriginAccountInput` al contrato canónico:
  - `paymentMethodCode`
  - `data`
- [x] Eliminar del input:
  - `zelleEmail`
  - `iban`
  - `stripePaymentMethodId`

## 4. Redesign validation model

- [x] Definir contrato mínimo de metadata en `PaymentMethod.additionalData`.
- [x] Implementar parse y validación estricta de metadata.
- [x] Reemplazar branching hardcodeado del use case por validación metadata-driven.
- [x] Validar campos permitidos, requeridos y restricciones por `fieldDefinitions`.
- [x] Implementar error explícito para metadata inválida.

## 5. Introduce canonical persistence

- [x] Agregar `originAccountData` como campo Prisma `Json` en `Remittance`.
- [x] Mantener `paymentMethodId` como referencia del método.
- [x] Ajustar puertos/adapters/mappers para usar `originAccountData` como fuente de verdad.

## 6. Historical backfill migration

- [x] Crear migración que backfillee `originAccountData` desde:
  - `originZelleEmail`
  - `originIban`
  - `originStripePaymentMethodId`
- [x] Verificar consistencia del backfill sobre remesas históricas.
- [x] Eliminar columnas legacy del schema final:
  - `originZelleEmail`
  - `originIban`
  - `originStripePaymentMethodId`

## 7. Redesign canonical output

- [x] Definir tipo canónico de salida para `originAccount`.
- [x] Exponer `originAccount` en `RemittanceType`.
- [x] Retirar de `RemittanceType`:
  - `originZelleEmail`
  - `originIban`
  - `originStripePaymentMethodId`

## 8. Catalog metadata enablement

- [x] Configurar metadata mínima para ZELLE.
- [x] Configurar metadata mínima para IBAN.
- [x] Configurar metadata mínima para STRIPE.
- [x] Asegurar que nuevos métodos solo requieran configuración de catálogo, no cambios estructurales de submit.

## 9. Tests

- [x] Agregar tests de input canónico para ZELLE.
- [x] Agregar tests de input canónico para IBAN.
- [x] Agregar tests de input canónico para STRIPE.
- [x] Agregar tests para metadata inválida.
- [x] Agregar tests para campo no permitido.
- [x] Agregar tests para campo requerido ausente.
- [x] Agregar tests para método nuevo configurado.
- [x] Agregar tests para backfill histórico.
- [x] Agregar tests de output canónico.

## 10. Technical validation

- [x] Ejecutar `npm run build`.
- [x] Ejecutar `PORT=3001 npm run start:dev`.
- [x] Revisar `schema.gql`.
- [x] Confirmar que el contrato final refleja solo el modelo canónico.

## 11. Final guardrails

- [x] Verificar que no queden acoplamientos activos a campos legacy en submit, puertos, adapters, persistencia ni output.
- [x] Verificar no-regresión fuera de alcance.
- [x] Confirmar cumplimiento estricto de guardrails del change.