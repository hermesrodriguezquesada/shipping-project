# Tasks: rf-030-remittance-pdf-receipt

## Tasks status

COMPLETED

## 1. Definir puerto de generacion PDF

- [x] Crear puerto de salida para generacion de comprobante PDF informativo.
- [x] Definir contrato minimo de entrada con los campos oficiales del comprobante RF-030 V1.
- [x] Definir salida apta para stream HTTP.

## 2. Implementar adapter de infraestructura PDF

- [x] Crear adapter que implemente el puerto de generacion PDF.
- [x] Implementar render simple del contenido obligatorio del comprobante.
- [x] Asegurar filename remittance-<id>.pdf en la respuesta HTTP.
- [x] Mantener alcance minimo sin templates avanzados.

## 3. Crear endpoint HTTP dedicado

- [x] Exponer GET /api/remittances/:id/receipt.pdf.
- [x] Configurar respuesta application/pdf por stream.
- [x] Confirmar descarga por HTTP y no por GraphQL.

## 4. Integrar con capa de aplicacion y lectura existente

- [x] Crear caso de uso para orquestar descarga de comprobante.
- [x] Reutilizar capa de lectura de remesas existente.
- [x] Construir modelo usando recipient snapshot como fuente principal de destinatario.

## 5. Implementar control de acceso

- [x] Validar autenticacion requerida (401 si no autenticado).
- [x] Permitir acceso a owner de la remesa.
- [x] Permitir acceso a admin.
- [x] Responder 403 cuando el usuario autenticado no tenga permiso.
- [x] Responder 404 cuando la remesa no exista.

## 6. Implementar reglas de contenido del PDF

- [x] Incluir secciones obligatorias del comprobante RF-030 V1.
- [x] Manejar correctamente campos opcionales sin fallar la generacion.
- [x] Validar render correcto de caracteres en espanol.

## 7. Manejo de errores y respuesta HTTP

- [x] Garantizar mapeo de errores: 401, 403, 404, 500.
- [x] Mantener operacion sincrona de descarga con respuesta deterministica.

## 8. Validacion runtime minima

- [x] Ejecutar npm run build.
- [x] Ejecutar start:dev.
- [x] Verificar endpoint en escenarios validos y de error.

## 9. Smoke tests

- [x] Owner descarga PDF (200).
- [x] Admin descarga PDF (200).
- [x] No autenticado (401).
- [x] Autenticado sin permiso (403).
- [x] Remesa inexistente (404).
- [x] PDF con recipient snapshot y contenido obligatorio.

## 10. Guardrails de alcance

- [x] Confirmar ausencia de cambios en GraphQL.
- [x] Confirmar ausencia de cambios en Prisma.
- [x] Confirmar ausencia de storage, versionado, historial, async processing, multiidioma, firma digital y QR.
- [x] Confirmar ausencia de cambios a RF-024 y RF-028.
- [x] Confirmar ausencia de refactors fuera de alcance.

## Cierre

- Todas las tareas del change estan completadas.
- No hubo desviaciones de alcance.
