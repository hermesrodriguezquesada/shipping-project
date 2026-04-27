# Specs: user-action-logs-phase-3-analytics-alerts

## Specs status

PROPOSED

## Requirement

Extender `UserActionLogs` con un MVP incremental para dashboard unificado, alertas basicas inline, correlacion de negocio por `correlationId` y readiness minima para BI, sin romper fases 1 y 2 ni introducir sobreingenieria.

## Acceptance criteria

### AC-1: Admin obtiene dashboard completo

- Dado un actor con rol `ADMIN` o `EMPLOYEE`.
- Cuando consulta `adminUserActionLogDashboard` con filtros validos.
- Entonces la respuesta debe incluir `summary`, `activityByDay`, `topActors`, `topActions` y `recentCriticalActions`.
- Y la informacion debe ser consumible por frontend en una sola llamada.

### AC-2: Dashboard reutiliza datos existentes correctamente

- Dado el reporting administrativo de fase 2 ya implementado.
- Cuando se construye el dashboard.
- Entonces `summary`, `activityByDay`, `topActors` y `topActions` deben conservar la misma semantica.
- Y no se debe duplicar la logica central de esas agregaciones.

### AC-3: Alerta se genera al superar threshold

- Dado un patron configurado como multiples `LOGIN` o `CANCEL_REMITTANCE` en ventana corta.
- Cuando el threshold se supera.
- Entonces el sistema debe persistir un `UserActionAlert` minimo.
- Y la alerta debe contener tipo, actor, descripcion y metadata segura.

### AC-4: Alert detection no rompe la accion original

- Dado un flujo ya auditado que dispara deteccion de alerta.
- Cuando falla la evaluacion o persistencia de `UserActionAlert`.
- Entonces la accion principal y el log base deben seguir completando normalmente.
- Y el fallo debe degradarse a observabilidad no bloqueante.

### AC-5: Correlacion funciona para remittance

- Dado un lifecycle de remittance con multiples acciones auditadas.
- Cuando los logs incluyen `correlationId` y metadata segura asociada.
- Entonces debe ser posible agrupar o seguir esas acciones relacionadas.
- Y `correlationId` debe seguir siendo opcional para otros casos.

### AC-6: Logs existentes siguen intactos

- Dado el modulo `UserActionLogs` de fases 1 y 2.
- Cuando se agregan las capacidades MVP de fase 3.
- Entonces `myUserActionLogs`, `adminUserActionLogs`, reporting y export on-demand deben seguir funcionando.
- Y los logs historicos sin `correlationId` deben seguir siendo validos.