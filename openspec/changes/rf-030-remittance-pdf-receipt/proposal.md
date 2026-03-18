# Proposal: rf-030-remittance-pdf-receipt

## Change status

COMPLETED

## Problem resolution

La brecha de RF-030 fue resuelta. El backend ahora permite descargar un comprobante PDF informativo de remesa en modo on-demand mediante endpoint HTTP dedicado.

## Implemented scope (completed)

Implementacion final entregada:

- Endpoint HTTP dedicado disponible: GET /api/remittances/:id/receipt.pdf
- Generacion de PDF informativo en backend on-demand
- Acceso permitido para owner y admin
- Uso de recipient snapshot como fuente oficial de destinatario
- Disponibilidad del comprobante para cualquier estado de remesa
- Respuesta application/pdf por stream con filename remittance-<id>.pdf

## Validation evidence summary

- ✔ Endpoint operativo y descarga valida de PDF
- ✔ 200 para owner
- ✔ 200 para admin
- ✔ 401 para no autenticado
- ✔ 403 para autenticado sin permiso
- ✔ 404 para remesa inexistente
- ✔ Contenido PDF validado:
  - Remittance ID
  - estado con label humano
  - fecha de creacion
  - remitente
  - destinatario desde recipient snapshot
  - montos enviado/recibido
  - monedas
  - metodo de pago
  - metodo de recepcion
  - tasa aplicada
  - paymentDetails cuando existe
  - leyenda informativa no fiscal
- ✔ Render de caracteres validado con texto real en espanol (ejemplo: República)
- ✔ npm run build OK
- ✔ start:dev OK
- ✔ src/schema.gql sin cambios

## Explicit non-impact confirmation

- Sin cambios en contrato GraphQL
- Sin cambios en schema Prisma
- Sin migraciones de base de datos
- Sin cambios en lifecycle de remesas

## Out of scope confirmation

Se respeto completamente el alcance definido:

- Sin storage de PDFs
- Sin versionado
- Sin historial de comprobantes
- Sin procesamiento asincrono
- Sin multiidioma
- Sin firma digital
- Sin QR
- Sin requisitos fiscales
- Sin cambios a RF-024
- Sin cambios a RF-028
- Sin refactors fuera de alcance
