# Tasks: user-action-logs-advanced-analytics-and-integrations

## Tasks status

PROPOSED

## 1. Discovery

- [ ] 1.1 Revisar implementacion actual de `user-action-logs` de fases 1 y 2 para identificar reuse exacto de filtros, use cases y adapters.
- [ ] 1.2 Confirmar contratos GraphQL existentes, guards y roles reutilizables para `ADMIN` y `EMPLOYEE`.
- [ ] 1.3 Identificar puntos de negocio donde `correlationId` puede poblarse sin romper la semantica actual.

## 2. Diseno de alertas

- [ ] 2.1 Definir el catalogo inicial de reglas de alerta y sus umbrales para login, cancelaciones, VIP payment proofs y actividad admin sensible.
- [ ] 2.2 Definir severidades, modelo de resolucion y metadata segura de `UserActionAlert`.
- [ ] 2.3 Confirmar estrategia asincrona best-effort para evaluacion de alertas sin side effects blocking.

## 3. Prisma models nuevos

- [ ] 3.1 Agregar modelo `UserActionAlert` con indices utiles para actor, tipo, severidad y fechas.
- [ ] 3.2 Agregar modelo `UserActionLogExportSchedule` con frecuencia, filtros y campos de scheduling.
- [ ] 3.3 Extender `UserActionLog` con `correlationId` e indices acordes al patron de consulta.
- [ ] 3.4 Generar migracion aditiva sin romper datos ni relaciones existentes.

## 4. Dashboard query

- [ ] 4.1 Crear `UserActionLogDashboard` y el input administrativo necesario para la query agregada.
- [ ] 4.2 Implementar el use case de dashboard reutilizando summary, activity by day, top actors y top actions de fase 2.
- [ ] 4.3 Agregar `recentCriticalActions` con limite interno y filtro coherente con el resto del dashboard.

## 5. Alert engine async

- [ ] 5.1 Crear el modulo `user-action-alerts` con puertos, use cases y adapters Prisma.
- [ ] 5.2 Publicar o disparar la evaluacion de alertas desde el registro de logs sin bloquear la accion principal.
- [ ] 5.3 Implementar persistencia y consulta administrativa basica de alertas.
- [ ] 5.4 Implementar resolucion manual de alertas si queda dentro del alcance aprobado.

## 6. Export scheduler

- [ ] 6.1 Crear el modulo `user-action-log-exports` con CRUD administrativo minimo para schedules.
- [ ] 6.2 Reutilizar el motor de export CSV on-demand para ejecucion automatica por schedule.
- [ ] 6.3 Implementar el scheduler que procesa schedules vencidos y actualiza `lastRunAt` y `nextRunAt`.
- [ ] 6.4 Definir manejo de concurrencia para evitar doble ejecucion del mismo schedule.

## 7. BI exposure

- [ ] 7.1 Definir vistas SQL o superficies read-only para `UserActionLog` y `UserActionAlert`.
- [ ] 7.2 Documentar columnas, restricciones, filtros esperados y politica de acceso BI.
- [ ] 7.3 Verificar que la estrategia no duplica datos ni obliga a otro pipeline analitico.

## 8. CorrelationId integration

- [ ] 8.1 Propagar `correlationId` desde flujos de remittance y otros casos de negocio relevantes.
- [ ] 8.2 Enriquecer metadata con ids y transiciones de estado seguras, sin snapshots sensibles.
- [ ] 8.3 Validar que logs historicos sin `correlationId` siguen siendo compatibles.

## 9. GraphQL updates

- [ ] 9.1 Exponer queries y types nuevos para dashboard, alertas y schedules.
- [ ] 9.2 Mantener seguridad administrativa uniforme para dashboard, alertas y exportes programados.
- [ ] 9.3 Regenerar `src/schema.gql` y revisar que el contrato sea aditivo.

## 10. Build

- [ ] 10.1 Ejecutar `npm run build`.
- [ ] 10.2 Corregir wiring, DI tokens, tipos GraphQL o contratos Prisma asociados a fase 3.
- [ ] 10.3 Validar que el scheduler y los modulos nuevos no introducen errores de bootstrap.

## 11. Tests

- [ ] 11.1 Validar `adminUserActionLogDashboard` con datos agregados consistentes.
- [ ] 11.2 Validar generacion asincrona de alertas sin romper la accion principal.
- [ ] 11.3 Validar ejecucion de export programado y actualizacion de fechas del schedule.
- [ ] 11.4 Validar acceso BI sobre la superficie gobernada sin duplicacion de datos.
- [ ] 11.5 Validar correlacion de remittance via `correlationId` y metadata segura.
- [ ] 11.6 Validar que fases 1 y 2 siguen funcionando sin regresiones.