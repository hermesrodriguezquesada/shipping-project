# Specs: rf-030-remittance-pdf-receipt

## Specs status

ALL ACCEPTANCE CRITERIA COMPLETED

## Requirement

Implementar comprobante PDF informativo para remesas en backend on-demand, descargable por endpoint HTTP dedicado, con acceso owner/admin y sin impacto en GraphQL ni Prisma.

## Acceptance criteria

### AC-1: Owner puede descargar comprobante PDF - ✔ Cumplido

- Evidencia: validacion manual HTTP con owner devuelve 200 y PDF adjunto.

### AC-2: Admin puede descargar comprobante PDF - ✔ Cumplido

- Evidencia: validacion manual HTTP con admin devuelve 200 y PDF adjunto.

### AC-3: Usuario no autenticado recibe 401 - ✔ Cumplido

- Evidencia: request sin autenticacion devuelve 401.

### AC-4: Usuario autenticado sin permiso recibe 403 - ✔ Cumplido

- Evidencia: request autenticado sin ownership ni rol admin devuelve 403.

### AC-5: Remesa inexistente retorna 404 - ✔ Cumplido

- Evidencia: request con id inexistente devuelve 404.

### AC-6: PDF contiene datos oficiales correctos - ✔ Cumplido

- Evidencia: contenido validado en entorno local con Remittance ID, estado, fecha de creacion, remitente, destinatario desde recipient snapshot, montos enviado/recibido, monedas, metodo de pago, metodo de recepcion, tasa aplicada y notas opcionales.

### AC-7: Estado mostrado con label humano - ✔ Cumplido

- Evidencia: el comprobante muestra label humano y no enum tecnico crudo.

### AC-8: Campos opcionales se manejan correctamente - ✔ Cumplido

- Evidencia: paymentDetails se muestra cuando existe, statusDescription se maneja como opcional sin romper generacion, la leyenda no fiscal esta presente y el render de caracteres en espanol fue validado (ejemplo: República).

### AC-9: No hay cambios en GraphQL schema - ✔ Cumplido

- Evidencia: start:dev ejecutado y schema.gql sin cambios.

### AC-10: No hay cambios en Prisma schema - ✔ Cumplido

- Evidencia: sin cambios en schema Prisma y sin migraciones.

## Constraints confirmation

- Disponible para cualquier estado de remesa
- Canal de descarga por endpoint HTTP (no GraphQL)
- Sin almacenamiento persistente de PDFs
- Sin procesamiento asincrono
