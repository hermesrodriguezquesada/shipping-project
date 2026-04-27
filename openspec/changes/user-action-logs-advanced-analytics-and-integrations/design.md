# Design: user-action-logs-advanced-analytics-and-integrations

## Design status

PROPOSED

## Context

`UserActionLogs` ya tiene dos fases previas:

- fase 1: registro non-blocking, sanitizacion y queries base `myUserActionLogs` y `adminUserActionLogs`,
- fase 2: summary, actividad por dia, top actors, top actions y export CSV on-demand.

La fase 3 extiende esa base para cubrir analitica avanzada, alertas y consumo externo sin abrir un pipeline paralelo ni duplicar datos. El sistema debe seguir siendo hexagonal, con separacion read/write, DI por tokens y adapters Prisma sobre PostgreSQL.

Restricciones principales:

- no romper contratos ni semantica de fases 1 y 2,
- no introducir side effects blocking,
- no duplicar logica de reporting ya existente,
- no ejecutar queries abiertas o no acotadas,
- mantener BI sobre una superficie gobernada, no sobre joins arbitrarios desde clientes.

Stakeholders principales:

- operaciones y soporte,
- compliance y auditoria interna,
- administracion de producto,
- equipo frontend administrativo,
- consumidores externos de BI como Metabase.

## Goals / Non-Goals

**Goals:**

- exponer un dashboard administrativo en una sola llamada, listo para consumir por frontend,
- detectar reglas iniciales de comportamiento sospechoso de forma asincrona y persistida,
- permitir exportaciones recurrentes configurables sin rehacer el export on-demand,
- habilitar consumo BI sin duplicar `UserActionLog`,
- correlacionar logs con entidades de negocio mediante `correlationId` y metadata segura,
- mantener cambios minimos y progresivos sobre la arquitectura actual.

**Non-Goals:**

- machine learning o scoring avanzado,
- acciones automaticas de bloqueo, suspension o remediation,
- streaming en tiempo real hacia frontend,
- push notifications,
- reconstruir historicos completos previos sin `correlationId`,
- crear un data warehouse o replica analitica dedicada en esta fase,
- modificar el modelo de seguridad base de fases 1 y 2.

## Decisions

### 1. Dashboard query como composicion de agregados existentes

Se agregara `adminUserActionLogDashboard(input): UserActionLogDashboard!` dentro de `user-action-logs`.

El dashboard devolvera:

- `summary`
- `activityByDay`
- `topActors`
- `topActions`
- `recentCriticalActions`

Decision:

- reutilizar los use cases y operaciones de query ya definidos en fase 2 para `summary`, `activityByDay`, `topActors` y `topActions`,
- agregar solo la pieza faltante `recentCriticalActions`,
- encapsular la composicion en un use case nuevo de lectura, por ejemplo `admin-user-action-log-dashboard.usecase.ts`, para evitar que el resolver duplique llamadas o mapeos.

Rationale:

- evita duplicar logica de filtros y agregaciones,
- mantiene un contrato frontend-ready sin romper queries existentes,
- permite introducir limites uniformes sobre listas internas del dashboard.

Alternativas consideradas:

- hacer que frontend llame cinco queries: descartado por mayor latencia, mas acoplamiento y duplicacion de coordinacion fuera del backend,
- crear una tabla materializada del dashboard: descartado por complejidad operativa innecesaria en esta etapa.

### 2. `recentCriticalActions` como lectura acotada sobre un set administrado de acciones sensibles

Se definira un conjunto inicial de acciones criticas, por ejemplo:

- `LOGIN` con alta frecuencia,
- `CANCEL_REMITTANCE`,
- `ADMIN_CANCEL_REMITTANCE`,
- `CREATE_VIP_PAYMENT_PROOF`,
- acciones administrativas sensibles sobre usuarios o pagos.

Decision:

- modelar `recentCriticalActions` como una lectura limitada y ordenada descendentemente por fecha sobre `UserActionLog`,
- reutilizar filtros del dashboard y aplicar un `limit` interno fijo o validado,
- no persistir un read model separado solo para esta lista.

Rationale:

- mantiene la fase 3 incremental,
- permite al frontend mostrar eventos relevantes sin abrir otra query,
- evita una nueva superficie de persistencia para una necesidad de lectura simple.

Alternativa considerada:

- derivar `recentCriticalActions` desde `UserActionAlert`: descartado porque no toda accion critica debe depender de que una regla dispare alerta.

### 3. Alert engine asincrono disparado por evento de aplicacion, no por bloqueo del flujo principal

Se introduce el modulo `user-action-alerts` con entidad persistida `UserActionAlert` y un evaluador de reglas sobre eventos de log registrados.

Modelo funcional sugerido:

```prisma
model UserActionAlert {
  id           String   @id @default(uuid())
  type         String
  severity     String
  actorUserId  String?
  description  String
  metadataJson String?
  createdAt    DateTime @default(now())
  resolvedAt   DateTime?
}
```

Decision:

- publicar un evento de aplicacion `UserActionLogRecorded` despues de persistir o intentar persistir el log funcional,
- procesar las reglas de alerta en un handler asincrono best-effort,
- persistir alertas en BD sin bloquear la accion original ni el registro base del log,
- evitar colas externas en esta fase; el handler queda desacoplado dentro del backend actual.

Reglas iniciales:

- multiples `LOGIN` en una ventana corta,
- muchas cancelaciones de remesas por actor o por rango temporal,
- creacion masiva de VIP payment proofs,
- actividad administrativa sensible sobre usuarios, pagos o estados de remesa.

Rationale:

- preserva el principio non-blocking,
- separa la deteccion de anomalas del write path principal,
- permite evolucionar reglas sin tocar cada flujo de negocio.

Alternativas consideradas:

- evaluar alertas inline dentro de cada use case: descartado por mayor acoplamiento y riesgo de latencia,
- usar cola externa desde el inicio: descartado por complejidad adicional para una primera version de alerting.

### 4. Scheduler de exportes como modulo dedicado que reutiliza el export on-demand

Se introduce `user-action-log-exports` con el modelo:

```prisma
model UserActionLogExportSchedule {
  id         String   @id @default(uuid())
  name       String
  filtersJson String
  frequency  String
  lastRunAt  DateTime?
  nextRunAt  DateTime
  createdBy  String
}
```

Decision:

- separar configuracion de schedules y ejecucion en un modulo nuevo,
- reutilizar el mismo motor de construccion CSV de fase 2 para generar el archivo,
- ejecutar schedules debidos con un scheduler interno que consulte `nextRunAt`,
- guardar el resultado operativo minimo del schedule y avanzar `lastRunAt`/`nextRunAt`,
- mantener los filtros serializados en JSON validado para evitar otro modelo combinatorio.

Rationale:

- evita duplicar logica de export,
- mantiene el scheduler desacoplado del resolver GraphQL,
- permite crecimiento incremental hacia historial de ejecuciones o destinos externos sin reescribir la base.

Alternativas consideradas:

- persistir archivos inmediatamente en otra tabla o bucket como parte obligatoria: descartado mientras no exista requerimiento confirmado de lifecycle de archivos,
- usar solo cron externo: descartado porque el sistema necesita definir y gobernar schedules desde la aplicacion.

### 5. BI access mediante vistas SQL o replica de lectura, sin duplicar datos

Decision:

- no duplicar `UserActionLog` ni `UserActionAlert` en tablas analiticas adicionales,
- definir una superficie BI gobernada basada en vistas SQL estables y documentadas,
- recomendar read replica si existe; si no existe, usar un usuario de solo lectura limitado a vistas especificas,
- documentar campos, filtros esperados y restricciones de acceso para herramientas como Metabase.

Vistas sugeridas:

- `vw_user_action_logs_bi`
- `vw_user_action_alerts_bi`
- `vw_user_action_log_dashboard_daily` si un agregado estable aporta valor operacional.

Rationale:

- BI obtiene un contrato mas estable que consultar tablas crudas,
- la gobernanza de acceso queda clara,
- se evita costo de sincronizacion o divergencia de datos.

Alternativas consideradas:

- endpoints REST o GraphQL para todo BI: descartado como unica estrategia porque herramientas como Metabase operan mejor sobre SQL read-only,
- ETL a otro datastore: descartado por ir mas alla del alcance incremental.

### 6. Correlation model como extension aditiva del log base

`UserActionLog` se extendera con:

- `correlationId`
- metadata de negocio acotada, por ejemplo `remittanceId`, `previousStatus`, `newStatus`

Decision:

- agregar `correlationId` nullable a `UserActionLog`,
- poblarlo desde flujos de negocio donde exista un identificador de correlacion natural o derivable,
- mantener metadata segura, resumida y orientada a trazabilidad, no al payload completo,
- permitir consultas y vistas que agrupen multiples acciones sobre la misma remesa o proceso.

Rationale:

- habilita trazabilidad transversal sin cambiar el patron append-only,
- conserva compatibilidad con logs historicos anteriores,
- mejora la investigacion operativa de una remesa a traves de multiples pasos.

Alternativas consideradas:

- guardar snapshots completos de la entidad de negocio: descartado por costo, sensibilidad y crecimiento de volumen,
- resolver correlacion unicamente desde joins externos: descartado porque faltaria un identificador comun confiable.

## Dashboard aggregation strategy

El use case de dashboard debera aceptar un filtro administrativo base y devolver una sola respuesta consistente temporalmente. Para minimizar divergencias:

- se reutilizara una unica funcion de construccion de filtros,
- se aplicaran los mismos `dateFrom`, `dateTo`, `actorUserId`, `action`, `resourceType` y `resourceId` sobre todos los segmentos,
- `topActors`, `topActions` y `recentCriticalActions` tendran limites maximos definidos,
- la query seguira siendo admin-only.

Si la consistencia fuerte entre segmentos se vuelve critica, el adapter puede ejecutar las lecturas dentro de la misma transaccion read-only cuando Prisma/PostgreSQL lo permitan. Si no, la fase 3 acepta consistencia operacional cercana siempre que el filtro temporal sea comun.

## Alert engine design

El modulo `user-action-alerts` seguira una estructura hexagonal:

```txt
src/modules/user-action-alerts/
  domain/
    ports/
  application/
    use-cases/
    services/
  infrastructure/
    adapters/
  presentation/
    graphql/
```

Servicios esperados:

- `evaluate-user-action-alerts.service.ts`
- `list-user-action-alerts.usecase.ts`
- `resolve-user-action-alert.usecase.ts`

Las reglas deben ser configurables en codigo con ventanas y umbrales claros para evitar magia oculta. La evaluacion debe consultar solo la ventana necesaria de logs o alertas previas para cada regla.

## Export scheduler strategy

El scheduler debe:

- leer schedules activos con `nextRunAt <= now()`,
- generar CSV mediante el exporter existente,
- registrar exito o fallo de la corrida,
- recalcular `nextRunAt` segun `daily` o `weekly`,
- evitar ejecuciones concurrentes duplicadas del mismo schedule.

La estrategia minima para concurrencia es tomar el schedule y actualizar `lastRunAt`/`nextRunAt` atomica o transaccionalmente. Si esto no es suficiente para despliegues con multiples instancias, la fase 3 debera documentar el requisito de un lock liviano basado en BD.

## BI integration strategy

La exposicion BI debe incluir documentacion operacional:

- vistas disponibles,
- definicion de columnas,
- significado de `severity`, `type`, `action` y `correlationId`,
- recomendaciones de filtros por fecha,
- politica de acceso read-only.

Metabase u otra herramienta externa no debe conectarse con privilegios amplios sobre tablas operativas. La preferencia es:

1. read replica con usuario read-only a vistas BI,
2. si no existe replica, usuario read-only a vistas en la base primaria,
3. endpoints export o queries GraphQL solo como complemento, no como sustituto total del acceso BI gobernado.

## Correlation model

La correlacion de negocio debe enfocarse en identificadores y estados, no en snapshots completos. Para remesas, ejemplos validos de metadata son:

```json
{
  "remittanceId": "...",
  "previousStatus": "PENDING_PAYMENT",
  "newStatus": "PAID"
}
```

`correlationId` puede ser:

- el id de la remesa si el flujo es monolitico alrededor de esa entidad,
- un identificador tecnico comun propagado entre pasos si el flujo cruza varias entidades,
- `null` cuando el caso no tenga correlacion funcional relevante.

## Risks / Trade-offs

- [Dashboard con demasiadas subconsultas] -> Mitigar reutilizando agregaciones existentes, limites internos y filtros temporales obligatorios.
- [Falsos positivos en alertas] -> Mitigar con umbrales iniciales conservadores, severidad y capacidad de resolucion manual.
- [Scheduler ejecutado por multiples instancias] -> Mitigar con actualizacion atomica/lock en BD y documentacion de despliegue.
- [BI acoplado a estructuras internas] -> Mitigar exponiendo vistas SQL versionables y documentadas, no tablas crudas.
- [Correlacion demasiado rica] -> Mitigar limitando metadata a ids, estados y campos seguros ya sanitizados.

## Migration Plan

1. Agregar modelos Prisma nuevos y extender `UserActionLog` con `correlationId` nullable.
2. Crear migracion SQL aditiva con indices sobre campos de consulta esperados.
3. Extender `user-action-logs` con la query de dashboard y el soporte de correlacion.
4. Introducir `user-action-alerts` y `user-action-log-exports` con wiring por tokens.
5. Agregar scheduler deshabilitado logicamente hasta que existan schedules activos.
6. Crear vistas BI y documentacion operativa de acceso.
7. Regenerar GraphQL schema, validar build y verificar que fases 1 y 2 no cambian semantica.

Rollback:

- desregistrar resolvers y providers nuevos,
- detener scheduler,
- dejar los campos y tablas aditivas sin uso mientras se decide rollback fisico de DB en una migracion posterior.

## Open Questions

- donde se publican o almacenan los CSV generados por schedules: descarga manual, objeto externo o historial interno,
- si `EMPLOYEE` puede crear/editar schedules o solo consumir resultados,
- si las alertas requieren query de listado y resolucion en la misma fase o solo persistencia y consulta basica,
- si `correlationId` debe ser visible en todas las queries existentes o solo en las nuevas superficies administrativas,
- si ya existe una read replica disponible para recomendarla formalmente en la documentacion BI.