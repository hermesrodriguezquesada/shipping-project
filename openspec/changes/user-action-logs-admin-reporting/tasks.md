# Tasks: user-action-logs-admin-reporting

## Tasks status

PROPOSED

## 1. Discovery read-only

- [x] Revisar el módulo actual `src/modules/user-action-logs/`.
- [x] Confirmar contratos vigentes de `myUserActionLogs` y `adminUserActionLogs`.
- [x] Confirmar guards, roles y decorators reutilizables para `ADMIN` y `EMPLOYEE`.
- [x] Verificar shape actual de `UserActionLog` y sanitización existente de metadata.

## 2. Actualizar puertos query

- [x] Extender `user-action-log-query.port.ts` con operaciones para summary, activity by day, top actors, top actions y export list.
- [x] Definir contratos de filtros compartidos entre reporting y export.
- [x] Mantener compatibilidad con queries existentes de fase 1.

## 3. Implementar agregaciones Prisma

- [x] Extender `prisma-user-action-log-query.adapter.ts` con `where` compartido para filtros administrativos.
- [x] Implementar conteo total y actores únicos para summary.
- [x] Implementar buckets de actividad por día.
- [x] Implementar ranking de top actores.
- [x] Implementar ranking de top acciones.
- [x] Implementar lectura paginada para export.

## 4. Implementar use cases summary, activity, top actors, top actions y export

- [x] Crear `admin-user-action-log-summary.usecase.ts`.
- [x] Crear `admin-user-action-log-activity-by-day.usecase.ts`.
- [x] Crear `admin-user-action-log-top-actors.usecase.ts`.
- [x] Crear `admin-user-action-log-top-actions.usecase.ts`.
- [x] Crear `admin-export-user-action-logs.usecase.ts`.
- [x] Centralizar validación mínima de rango y límites donde corresponda.

## 5. Crear inputs/types GraphQL

- [x] Crear `AdminUserActionLogReportInput`.
- [x] Crear `AdminUserActionLogTopInput`.
- [x] Crear `AdminExportUserActionLogsInput`.
- [x] Crear `UserActionLogSummary`.
- [x] Crear `UserActionLogActivityBucket`.
- [x] Crear `UserActionLogTopActor`.
- [x] Crear `UserActionLogTopAction`.
- [x] Crear `UserActionLogExportPayload`.

## 6. Extender resolver

- [x] Extender `user-action-logs.resolver.ts` con las cinco queries administrativas nuevas.
- [x] Mantener sin cambios `myUserActionLogs`.
- [x] Mantener sin cambios `adminUserActionLogs`.

## 7. Validar roles ADMIN/EMPLOYEE

- [x] Reutilizar guards/decorators existentes de acceso administrativo.
- [x] Confirmar denegación explícita a usuarios fuera de `ADMIN` y `EMPLOYEE`.

## 8. Generar CSV base64

- [x] Implementar serialización CSV con escaping correcto.
- [x] Generar `contentBase64`, `fileName`, `mimeType`, `sizeBytes` y `generatedAt`.
- [x] Confirmar que export no agrega metadata sensible nueva.
- [x] Confirmar generación on-demand sin persistencia.

## 9. Regenerar schema

- [x] Regenerar GraphQL schema code-first.
- [x] Verificar presencia del nuevo contrato en `src/schema.gql`.

## 10. Build

- [x] Ejecutar `npm run build`.
- [x] Corregir wiring, tipado o errores GraphQL/Prisma asociados a fase 2.

## 11. Smoke tests GraphQL

- [ ] Probar `adminUserActionLogSummary`.
- [ ] Probar `adminUserActionLogActivityByDay`.
- [ ] Probar `adminUserActionLogTopActors`.
- [ ] Probar `adminUserActionLogTopActions`.
- [ ] Probar `adminExportUserActionLogs`.
- [ ] Validar filtros por `action`, `resourceType`, `resourceId` y `actorUserId`.
- [ ] Validar acceso denegado a usuario no admin.
- [ ] Validar que fase 1 sigue funcionando igual.