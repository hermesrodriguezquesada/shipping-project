# Design: rf-030-remittance-pdf-receipt

## Design status

IMPLEMENTED AS DESIGNED

## Deviation status

No deviations.

## Architecture overview (final)

Se implemento el diseno aprobado, manteniendo arquitectura hexagonal y alcance minimo:

- Caso de uso dedicado para orquestar descarga del comprobante.
- Puerto de generacion PDF desacoplado de aplicacion.
- Adapter de infraestructura para render del PDF.
- Endpoint HTTP dedicado para descarga.
- Reuso de capa existente de lectura de remesas.

No se modifico:

- GraphQL
- Prisma
- lifecycle de remesas

## Implemented components

### Application

- Caso de uso de descarga de comprobante implementado.
- Validacion de acceso aplicada por owner o admin.
- Orquestacion de lectura de remesa y generacion de PDF implementada.

### Domain ports

- Puerto de generacion PDF implementado con contrato minimo para descarga HTTP.

### Infrastructure adapters

- Adapter de generacion PDF implementado con layout simple y estable.
- Ajuste tecnico de compatibilidad de caracteres aplicado para render correcto de texto en espanol.

### Interface (HTTP)

- Endpoint implementado: GET /api/remittances/:id/receipt.pdf
- Entrega por stream con application/pdf y attachment filename remittance-<id>.pdf

## Final flow confirmation

1. Validar autenticacion.
2. Validar autorizacion owner/admin.
3. Obtener remesa.
4. Construir modelo de comprobante desde fuentes oficiales.
5. Generar PDF y responder stream.

## Access and error policy (implemented)

- 401 no autenticado
- 403 autenticado sin permiso
- 404 remesa inexistente
- 500 error interno de generacion
- 200 descarga exitosa

Todos estos comportamientos fueron validados manualmente en entorno local.

## Official data source confirmation

Fuente aplicada en implementacion:

- recipient snapshot como fuente oficial de destinatario
- owner
- montos
- monedas
- metodos
- tasa aplicada
- estado actual con label humano
- fechas relevantes
- notas opcionales (paymentDetails, statusDescription)

## PDF content confirmation

Contenido obligatorio implementado y validado:

- Header branding simple
- Remittance ID
- Estado con label humano
- Fecha de creacion
- Remitente
- Destinatario desde recipient snapshot
- Montos enviado/recibido
- Monedas
- Metodo de pago
- Metodo de recepcion
- Tasa aplicada
- paymentDetails cuando existe
- statusDescription cuando existe
- Leyenda no fiscal

## Validation summary

- npm run build OK
- start:dev OK
- schema.gql sin cambios
- smoke tests HTTP completos OK

## Non-impact and scope guardrails confirmation

- Sin cambios en GraphQL
- Sin cambios en Prisma
- Sin cambios en lifecycle
- Sin storage
- Sin async processing
- Sin QR
- Sin firma digital
- Sin requisitos fiscales
- Sin cambios a RF-024 ni RF-028
- Sin refactors fuera de alcance
