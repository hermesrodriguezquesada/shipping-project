# Specs: user-action-logs-advanced-analytics-and-integrations

## Specs status

PROPOSED

## Requirement

Extender `UserActionLogs` con capacidades avanzadas de analitica, alertas, exportacion programada, acceso BI controlado y correlacion de negocio, manteniendo intactas las fases 1 y 2 en su semantica de registro non-blocking, consultas existentes y reporting administrativo ya disponible.

## Acceptance criteria

### AC-1: Admin obtiene dashboard completo en una sola llamada

- Dado un actor con rol `ADMIN` o `EMPLOYEE`.
- Cuando consulta `adminUserActionLogDashboard` con filtros validos.
- Entonces la respuesta debe incluir `summary`, `activityByDay`, `topActors`, `topActions` y `recentCriticalActions`.
- Y el frontend no debe necesitar multiples llamadas para construir el dashboard base.

### AC-2: Dashboard reutiliza las reglas de reporting existentes

- Dado el reporting administrativo ya implementado en fase 2.
- Cuando se agrega la query de dashboard.
- Entonces `summary`, `activityByDay`, `topActors` y `topActions` deben conservar la misma semantica de filtros y seguridad.
- Y no se debe duplicar logica de agregacion de fase 2 en otro flujo separado.

### AC-3: Una alerta se genera de forma asincrona

- Dado un patron sospechoso configurado, como multiples `LOGIN` en corto tiempo.
- Cuando se registran logs que cumplen la regla.
- Entonces el sistema debe generar un `UserActionAlert` persistido.
- Y la accion principal del usuario no debe bloquearse ni fallar por la generacion de la alerta.

### AC-4: Admin consulta alertas

- Dado un actor con rol `ADMIN` o `EMPLOYEE`.
- Cuando consulta la superficie administrativa de alertas.
- Entonces debe poder ver tipo, severidad, descripcion, actor relacionado, metadata segura y estado de resolucion.
- Y usuarios sin esos roles no deben acceder a esa informacion.

### AC-5: Export programado se ejecuta

- Dado un `UserActionLogExportSchedule` activo con filtros configurados.
- Cuando llega `nextRunAt`.
- Entonces el sistema debe ejecutar la generacion automatica del CSV usando la misma semantica de filtros aprobada.
- Y debe actualizar `lastRunAt` y `nextRunAt` sin requerir intervencion manual.

### AC-6: BI puede consumir datos sin duplicacion

- Dado un consumidor BI autorizado, como Metabase.
- Cuando accede a la superficie BI gobernada.
- Entonces debe poder consultar datos de auditoria y alertas desde vistas o queries optimizadas.
- Y el sistema no debe duplicar `UserActionLog` en otra fuente de datos solo para analitica.

### AC-7: Correlacion de remittance funciona

- Dado un flujo de remesa con multiples acciones a lo largo del tiempo.
- Cuando los logs incluyen `correlationId` y metadata segura como `remittanceId`, `previousStatus` y `newStatus`.
- Entonces debe ser posible seguir la remesa a traves de multiples acciones correlacionadas.
- Y la metadata no debe incluir payloads sensibles ni snapshots completos innecesarios.

### AC-8: Fases 1 y 2 no se rompen

- Dado el modulo `UserActionLogs` ya desplegado con fases 1 y 2.
- Cuando se agregan las capacidades de fase 3.
- Entonces `myUserActionLogs`, `adminUserActionLogs`, reporting administrativo y export on-demand deben seguir funcionando.
- Y el registro de logs debe seguir siendo non-blocking.