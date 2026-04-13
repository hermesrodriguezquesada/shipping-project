# Tasks: 20260413-remittance-payment-proof-mark-paid

## Tasks status

ALL TASKS COMPLETED

## Implementation tasks

- [x] Crear helper `payment-details-proof.ts` con `buildPaymentDetailsProofJson()` y `extractPaymentProofKeyFromDetails()`
- [x] Actualizar `RemittanceLifecycleUseCase.markPaid` para soportar modo comprobante (paymentProofKey + accountHolderName)
- [x] Inyectar `REMITTANCE_PAYMENT_PROOF_STORAGE_PORT` en `RemittanceLifecycleUseCase` (4to argumento)
- [x] Actualizar `RequestRemittancePaymentProofUploadUseCase` para usar key UUID-only (sin timestamp ni filename del cliente)
- [x] Actualizar `GetRemittancePaymentProofViewUrlUseCase` para leer key desde `paymentDetails` JSON (con fallback legacy)
- [x] Eliminar mutation `attachRemittancePaymentProof` del resolver GraphQL
- [x] Agregar argumentos `paymentProofKey` y `accountHolderName` a `markRemittancePaid` en el resolver (con `type: () => String` explícito para evitar `UndefinedTypeError` de NestJS/GraphQL)
- [x] Eliminar `RemittancePaymentProofType` y campo `paymentProof` de `RemittanceType`
- [x] Eliminar `AttachRemittancePaymentProofUseCase` del módulo `RemittancesModule`
- [x] Actualizar `remittances.resolver.spec.ts` para alinear constructor con nueva firma
- [x] Actualizar `scripts/smoke-external-payments.ts` para pasar stub de `paymentProofStorage` al constructor

## Validation tasks

- [x] `npm run build` sin errores TypeScript
- [x] `start:dev` inicia sin errores — puerto 3001
- [x] Verificar contrato en `schema.gql`:
  - [x] `markRemittancePaid` contiene `paymentProofKey` y `accountHolderName`
  - [x] `attachRemittancePaymentProof` no existe
  - [x] `requestRemittancePaymentProofUpload` presente
  - [x] `remittancePaymentProofViewUrl` presente
- [x] Validación manual de punta a punta ejecutada:
  - [x] Upload URL generada
  - [x] Archivo subido a S3 con PUT real
  - [x] `markRemittancePaid` con paymentProofKey + accountHolderName
  - [x] `paymentDetails` persistido con estructura JSON correcta
  - [x] Estado transicionado a `PENDING_PAYMENT_CONFIRMATION`
  - [x] `remittancePaymentProofViewUrl` devuelve URL firmada funcional
