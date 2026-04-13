# Specs: 20260413-remittance-payment-proof-mark-paid

## Specs status

ALL ACCEPTANCE CRITERIA COMPLETED

## Requirement

Integrar el comprobante de pago de remesa (imagen, subida a S3) directamente en la operación `markRemittancePaid`, reemplazando el flujo separado de attach. El frontend sube el archivo a S3 con presigned URL y luego informa el pago con la key del archivo y el nombre del titular de cuenta. El backend persiste la referencia en `paymentDetails` como JSON estructurado y permite visualización posterior con URL firmada temporal.

## Acceptance criteria

### AC-1: Frontend puede obtener URL de subida para comprobante — ✔ Cumplido

- Mutation: `requestRemittancePaymentProofUpload(input: RequestRemittancePaymentProofUploadInput!): RemittancePaymentProofUploadPayload!`
- Input: `remittanceId`, `fileName`, `mimeType`, `sizeBytes`
- Retorna: `uploadUrl` (presigned S3 PUT), `key` (key en S3), `method: "PUT"`, `expiresAt` (15 min TTL)
- Acceso: sólo owner de la remesa
- MIME aceptados: `image/jpeg`, `image/png`, `image/webp`
- Tamaño máximo: 10 MB
- Evidencia: validación manual exitosa — URL de subida generada correctamente.

### AC-2: Key de archivo en S3 usa UUID como identificador único — ✔ Cumplido

- Formato de key: `remittances/<remittanceId>/payment-proof/<UUID>.<ext>`
- Extensión derivada del fileName, sanitizada (`/^[.][a-z0-9]{1,10}$/`)
- Sin timestamp ni nombre de archivo del cliente en la key
- Evidencia: key inspeccionada en validación manual conforme al formato UUID.

### AC-3: Frontend sube el archivo a S3 directamente — ✔ Cumplido (requisito de cliente)

- El frontend debe hacer `PUT <uploadUrl>` con el contenido binario raw del archivo
- Header `Content-Type` debe coincidir exactamente con el `mimeType` del input
- Sin form-data, sin multipart — contenido binario directo
- El backend no interviene en la subida — la URL es presignada para PUT directo
- Evidencia: subida real ejecutada en validación manual con imagen real.

### AC-4: `markRemittancePaid` acepta comprobante de pago integrado — ✔ Cumplido

- Signature final: `markRemittancePaid(remittanceId: ID!, paymentProofKey: String, accountHolderName: String, paymentDetails: String): Boolean!`
- Cuando se envían `paymentProofKey` y `accountHolderName`: el backend valida prefijo de key, verifica existencia real del archivo en S3 (HeadObject), y construye `paymentDetails` como JSON
- El argumento legacy `paymentDetails` (texto libre) sigue aceptado si no se envían los argumentos de comprobante — compatibilidad hacia atrás
- Evidencia: mutación ejecutada en validación manual con respuesta `true`.

### AC-5: `paymentDetails` persiste la referencia al comprobante en formato JSON acordado — ✔ Cumplido

- Estructura persistida:
  ```json
  [
    {"name": "img_payment_proof", "value": "<paymentProofKey>"},
    {"name": "account_holder_name", "value": "<accountHolderName>"}
  ]
  ```
- Construida por `buildPaymentDetailsProofJson()` en `payment-details-proof.ts`
- Evidencia: campo `paymentDetails` inspeccionado en base de datos tras validación — estructura correcta.

### AC-6: Estado de remesa transiciona a `PENDING_PAYMENT_CONFIRMATION` — ✔ Cumplido

- Evidencia: estado de remesa verificado tras `markRemittancePaid` — transición correcta.

### AC-7: Frontend puede obtener URL firmada de visualización del comprobante — ✔ Cumplido

- Query: `remittancePaymentProofViewUrl(remittanceId: ID!): RemittancePaymentProofViewPayload!`
- Retorna: `viewUrl` (presigned S3 GET, TTL 5 min), `expiresAt`
- El backend extrae la key desde `paymentDetails` JSON (con fallback al campo legacy `paymentProofKey`)
- Acceso: owner de la remesa y roles ADMIN/EMPLOYEE
- Evidencia: URL firmada generada y visualizada correctamente en validación manual.

### AC-8: Mutation `attachRemittancePaymentProof` eliminada del contrato — ✔ Cumplido

- La mutación ya no existe en `schema.gql`
- Evidencia: `grep attachRemittancePaymentProof src/schema.gql` no retorna resultados.

### AC-9: Campo `paymentProof: RemittancePaymentProofType` eliminado de `RemittanceType` — ✔ Cumplido

- El sub-objeto de comprobante ya no es parte de `RemittanceType` en GraphQL
- El comprobante solo se accede vía `remittancePaymentProofViewUrl`
- Evidencia: `RemittancePaymentProofType` no existe en `schema.gql`.

### AC-10: Build y start:dev sin errores — ✔ Cumplido

- `npm run build` exit code 0
- `start:dev` arranca limpio en puerto 3001
- Evidencia: ejecutados en sesión de validación final.

## Constraints confirmation

- El archivo no se sube al backend — sube directamente a S3 vía presigned PUT URL
- El comprobante se identifica por key en S3, no por URL pública persistida
- La URL de visualización es temporal (5 min TTL) y se genera bajo demanda
- `paymentProofKey` debe pertenecer al prefijo `remittances/<remittanceId>/payment-proof/` — validado en backend
