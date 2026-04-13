# Proposal: 20260413-remittance-payment-proof-mark-paid

## Change status

COMPLETED

## Problem resolution

El frontend requería un flujo de comprobante de pago de remesa que fuera cohesivo con la operación de informar el pago. El flujo anterior planteaba un paso separado `attachRemittancePaymentProof` como operación principal, lo cual resultó desalineado con la integración real del frontend. El diseño fue corregido para integrar el comprobante directamente en `markRemittancePaid`.

## Implemented scope (completed)

El flujo de comprobante de pago quedó completamente integrado con `markRemittancePaid`:

- Presigned upload URL generada vía `requestRemittancePaymentProofUpload` (S3, TTL 15 min, MIME image/jpeg|png|webp, máx 10 MB)
- La key del archivo en S3 usa exclusivamente UUID: `remittances/<remittanceId>/payment-proof/<UUID>.<ext>`
- `markRemittancePaid` acepta `paymentProofKey` y `accountHolderName` junto con el `remittanceId` existente
- El backend valida prefijo de key, existencia real del archivo en S3, y construye el JSON de `paymentDetails`
- `paymentDetails` se persiste como JSON string con estructura acordada con frontend
- Estado transiciona a `PENDING_PAYMENT_CONFIRMATION` al confirmar el pago
- Presigned view URL generada vía `remittancePaymentProofViewUrl` (S3 GET, TTL 5 min), accesible para owner y roles ADMIN/EMPLOYEE
- La mutación `attachRemittancePaymentProof` fue eliminada del contrato GraphQL — ya no existe
- El campo `paymentProof: RemittancePaymentProofType` fue eliminado de `RemittanceType` en GraphQL

## Validation evidence summary

Validación ejecutada manualmente de punta a punta:

- ✔ Creación de remesa con `submitRemittanceV2`
- ✔ Solicitud de URL de upload con `requestRemittancePaymentProofUpload`
- ✔ Subida real del archivo a S3 vía PUT con Content-Type correcto (binario raw, sin form-data)
- ✔ `markRemittancePaid` con `paymentProofKey` y `accountHolderName` — retorna `true`
- ✔ Persistencia correcta en `paymentDetails` con estructura JSON acordada
- ✔ Transición de estado correcta a `PENDING_PAYMENT_CONFIRMATION`
- ✔ `remittancePaymentProofViewUrl` retorna URL firmada temporal funcional
- ✔ `npm run build` OK
- ✔ `start:dev` OK — app inicia en puerto 3001 sin errores
- ✔ `src/schema.gql` contiene contrato final correcto

## Explicit non-impact confirmation

- Sin cambios en Prisma schema (los campos legacy `paymentProofKey`, `paymentProofFileName`, etc. que quedaron del diseño anterior no fueron eliminados — deuda técnica planificada)
- Sin nuevas migraciones
- Sin cambios en el lifecycle de estados de remesa (flujo de transiciones intacto)
- Sin cambios en los resolvers de lectura de remesas
- Sin impacto en `adminConfirmRemittancePayment` ni `adminMarkRemittanceDelivered`
