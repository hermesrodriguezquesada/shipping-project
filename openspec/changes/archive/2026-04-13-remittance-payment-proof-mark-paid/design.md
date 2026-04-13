# Design: 20260413-remittance-payment-proof-mark-paid

## Design status

IMPLEMENTED AS DESIGNED

## Deviation status

Desviación respecto al diseño inicial: el flujo de `attachRemittancePaymentProof` como operación separada fue descartado. El diseño final integra el comprobante directamente en `markRemittancePaid`.

Esta desviación fue acordada con frontend y quedó validada de punta a punta.

## Architecture overview (final)

La implementación sigue la arquitectura hexagonal existente del proyecto:

- Puerto de storage de comprobante: `RemittancePaymentProofStoragePort` (S3 adapter)
- Caso de uso de lifecycle (`RemittanceLifecycleUseCase`) orquesta validación de key, existencia en S3 y persistencia
- Caso de uso de upload (`RequestRemittancePaymentProofUploadUseCase`) genera presigned PUT URL
- Caso de uso de visualización (`GetRemittancePaymentProofViewUrlUseCase`) genera presigned GET URL
- Helper `payment-details-proof.ts` encapsula construcción y parseo del JSON de `paymentDetails`
- Resolver GraphQL expone los tres puntos de entrada al frontend

No se modificó:

- El lifecycle de estados de remesa
- El contrato de lectura de remesas (`RemittanceType`)
- Prisma schema (sin migraciones nuevas)
- Lógica de email notifications

## Implemented components

### Application — use cases

- `RemittanceLifecycleUseCase.markPaid`:
  - Modo comprobante: valida prefijo de key, llama `paymentProofStorage.exists()`, construye JSON paymentDetails vía helper
  - Modo legacy: acepta `paymentDetails` como texto libre si no se envían args de comprobante
  - Inyecta `REMITTANCE_PAYMENT_PROOF_STORAGE_PORT` como nueva dependencia (4to argumento de constructor)

- `RequestRemittancePaymentProofUploadUseCase`:
  - Key strategy: `remittances/<remittanceId>/payment-proof/<randomUUID()>.<safeExt>`
  - TTL upload: 15 minutos
  - MIME permitidos: `image/jpeg`, `image/png`, `image/webp`
  - Tamaño máximo: 10 MB (validado en presigned URL config)

- `GetRemittancePaymentProofViewUrlUseCase`:
  - Lee key desde `paymentDetails` JSON vía `extractPaymentProofKeyFromDetails()`
  - Fallback al campo legacy `remittance.paymentProofKey` si JSON no contiene key
  - TTL view URL: 5 minutos
  - Auth: owner OR rol ADMIN/EMPLOYEE

### Application — helpers

- `src/modules/remittances/application/utils/payment-details-proof.ts`
  - `buildPaymentDetailsProofJson({ paymentProofKey, accountHolderName })`: construye JSON string acordado
  - `extractPaymentProofKeyFromDetails(paymentDetails)`: parsea JSON array, extrae `img_payment_proof.value`, retorna `null` si no existe o falla parseo

### Infrastructure adapters

- `S3RemittancePaymentProofStorageAdapter`:
  - `createPresignedUploadUrl()` → PutObjectCommand + getSignedUrl
  - `createPresignedViewUrl()` → GetObjectCommand + getSignedUrl
  - `exists()` → HeadObjectCommand (sin arroja 403/404 → retorna false)

### Interface — GraphQL resolver

- `requestRemittancePaymentProofUpload(input: RequestRemittancePaymentProofUploadInput!)` → `RemittancePaymentProofUploadPayload`
- `markRemittancePaid(remittanceId: ID!, paymentProofKey: String, accountHolderName: String, paymentDetails: String)` → `Boolean!`
- `remittancePaymentProofViewUrl(remittanceId: ID!)` → `RemittancePaymentProofViewPayload`
- Removido: `attachRemittancePaymentProof` (ya no existe)

### Contrato GraphQL final (schema.gql)

```graphql
# Mutation: solicitar URL de subida
requestRemittancePaymentProofUpload(input: RequestRemittancePaymentProofUploadInput!): RemittancePaymentProofUploadPayload!

# Mutation: informar pago (con o sin comprobante)
markRemittancePaid(accountHolderName: String, paymentDetails: String, paymentProofKey: String, remittanceId: ID!): Boolean!

# Query: obtener URL de visualización firmada
remittancePaymentProofViewUrl(remittanceId: ID!): RemittancePaymentProofViewPayload!

# Input
input RequestRemittancePaymentProofUploadInput {
  fileName: String!
  mimeType: String!
  remittanceId: ID!
  sizeBytes: Int!
}

# Payloads
type RemittancePaymentProofUploadPayload {
  expiresAt: DateTime!
  key: String!
  method: String!
  uploadUrl: String!
}

type RemittancePaymentProofViewPayload {
  expiresAt: DateTime!
  viewUrl: String!
}
```

## Final flow confirmation

1. Frontend crea la remesa con `submitRemittanceV2`
2. Frontend llama `requestRemittancePaymentProofUpload` con `remittanceId`, `fileName`, `mimeType`, `sizeBytes`
3. Backend devuelve `uploadUrl` (presigned S3 PUT), `key`, `method: "PUT"`, `expiresAt`
4. Frontend sube la imagen a S3 con `PUT <uploadUrl>` — body binario raw, `Content-Type: <mimeType>` exacto
5. Frontend llama `markRemittancePaid(remittanceId, paymentProofKey: <key>, accountHolderName: "<nombre>")`
6. Backend:
   - Valida prefijo de key (`remittances/<remittanceId>/payment-proof/`)
   - Verifica existencia del archivo en S3 (HeadObject)
   - Construye `paymentDetails` JSON: `[{"name":"img_payment_proof","value":"<key>"},{"name":"account_holder_name","value":"<nombre>"}]`
   - Persiste y transiciona estado a `PENDING_PAYMENT_CONFIRMATION`
7. Frontend o admin llama `remittancePaymentProofViewUrl(remittanceId)` para obtener URL firmada temporal (5 min)

## Format of paymentDetails when proof is present

```json
[
  {"name": "img_payment_proof", "value": "remittances/<id>/payment-proof/<UUID>.jpg"},
  {"name": "account_holder_name", "value": "Juan Pérez"}
]
```

## Access and authorization policy

| Operación | Acceso permitido |
|-----------|-----------------|
| `requestRemittancePaymentProofUpload` | Owner (dueño de la remesa) |
| `markRemittancePaid` | Owner |
| `remittancePaymentProofViewUrl` | Owner, ADMIN, EMPLOYEE |

## Technical debt registered

- Los campos legacy de Prisma (`paymentProofKey`, `paymentProofFileName`, `paymentProofMimeType`, `paymentProofSizeBytes`, `paymentProofUploadedAt`) quedaron en el schema de base de datos — no eliminados intencionalmente para evitar migración de emergencia. Planificados para limpieza futura.
- El archivo `attach-remittance-payment-proof.usecase.ts` quedó huérfano en disco — no registrado en módulo ni expuesto. Pendiente de eliminación.
- El método `attachPaymentProof` en el command port y adapter quedó como dead code — pendiente de eliminación.
- El modo legacy de `markRemittancePaid` (paymentDetails como texto libre) sigue activo por compatibilidad — sin fecha de deprecación definida.
