# Specs: user-action-logs-admin-reporting

## Specs status

PROPOSED

## Requirement

Extender `UserActionLogs` con reporting administrativo agregado y exportación CSV on-demand para `ADMIN` y `EMPLOYEE`, reutilizando los logs ya persistidos, sin cambiar el comportamiento de registro de fase 1 y sin exponer datos sensibles adicionales.

## Acceptance criteria

### AC-1: Admin obtiene summary por rango de fechas

- Dado un actor con rol `ADMIN` o `EMPLOYEE`.
- Cuando consulta `adminUserActionLogSummary` con `dateFrom` y `dateTo` válidos.
- Entonces la respuesta debe incluir `totalActions`, `uniqueActors`, `dateFrom` y `dateTo`.
- Y `totalActions` debe reflejar la cantidad de logs filtrados por el rango y filtros opcionales enviados.

### AC-2: Admin obtiene actividad por día

- Dado un actor con rol `ADMIN` o `EMPLOYEE`.
- Cuando consulta `adminUserActionLogActivityByDay` con un rango de fechas válido.
- Entonces debe recibir una lista de buckets diarios.
- Y cada bucket debe incluir `date`, `actionCount` y `uniqueActors`.

### AC-3: Admin obtiene top actores

- Dado un actor con rol `ADMIN` o `EMPLOYEE`.
- Cuando consulta `adminUserActionLogTopActors` con filtros válidos.
- Entonces debe recibir actores ordenados por actividad descendente.
- Y cada item debe incluir `actorUserId`, `actorEmail`, `actorRole`, `actionCount` y `lastActionAt`.

### AC-4: Admin obtiene top acciones

- Dado un actor con rol `ADMIN` o `EMPLOYEE`.
- Cuando consulta `adminUserActionLogTopActions` con filtros válidos.
- Entonces debe recibir un ranking agregado por `action`.
- Y cada item debe incluir `action` y `actionCount`.

### AC-5: Admin exporta CSV

- Dado un actor con rol `ADMIN` o `EMPLOYEE`.
- Cuando consulta `adminExportUserActionLogs` con filtros válidos.
- Entonces el sistema debe generar el archivo CSV on-demand.
- Y la respuesta debe incluir `contentBase64`, `fileName`, `mimeType`, `sizeBytes` y `generatedAt`.

### AC-6: Usuario no admin no puede acceder a reporting

- Dado un usuario autenticado sin rol `ADMIN` ni `EMPLOYEE`.
- Cuando intenta ejecutar cualquiera de las queries administrativas de reporting de fase 2.
- Entonces el sistema debe negar acceso.
- Y no debe retornar datos agregados ni payload de export.

### AC-7: Filtros funcionan por action, resource y actor

- Dado un actor autorizado con logs heterogéneos en el rango solicitado.
- Cuando envía filtros por `actorUserId`, `action`, `resourceType` y/o `resourceId`.
- Entonces summary, activity, top actors, top actions y export deben respetar el mismo subconjunto lógico de datos.
- Y la combinación de filtros no debe alterar la seguridad del módulo.

### AC-8: Export no expone datos sensibles adicionales

- Dado que los logs persistidos ya contienen metadata sanitizada de fase 1.
- Cuando se genera el CSV de exportación.
- Entonces el archivo no debe agregar passwords, tokens, base64, S3 keys, documentos, imágenes ni datos bancarios completos.
- Y solo debe exponer campos seguros ya disponibles en el modelo de log.

### AC-9: Fase 1 sigue funcionando igual

- Dado el módulo `UserActionLogs` ya implementado en fase 1.
- Cuando se agregan las capacidades de reporting de fase 2.
- Entonces `myUserActionLogs` debe conservar su contrato y comportamiento actuales.
- Y `adminUserActionLogs`, la escritura de logs y la integración non-blocking existente no deben cambiar semánticamente.