# Tasks: user-action-logs-phase-3-analytics-alerts

## Tasks status

PROPOSED

## 1. Discovery

- [ ] 1.1 Revisar el modulo actual `src/modules/user-action-logs/` y confirmar reuse exacto de reporting fase 2.
- [ ] 1.2 Confirmar limites actuales, filtros administrativos y puntos de integracion non-blocking ya existentes.
- [ ] 1.3 Identificar flujos de remittance y acciones admin sensibles donde `correlationId` y alert detection aportan valor inmediato.

## 2. Dashboard use-case

- [ ] 2.1 Crear `admin-user-action-log-dashboard.usecase.ts` como composicion de use cases existentes de reporting.
- [ ] 2.2 Definir el segmento `recentCriticalActions` con limites pequenos y filtros coherentes.
- [ ] 2.3 Reutilizar validaciones y filtros administrativos existentes para evitar duplicacion.

## 3. Dashboard GraphQL

- [ ] 3.1 Crear `UserActionLogDashboard` y el input GraphQL necesario.
- [ ] 3.2 Exponer `adminUserActionLogDashboard(input)` en el resolver actual de `user-action-logs`.
- [ ] 3.3 Mantener acceso restringido a `ADMIN` y `EMPLOYEE`.

## 4. Alert detection (inline)

- [ ] 4.1 Crear `detect-user-action-alert.usecase.ts` dentro del modulo existente.
- [ ] 4.2 Implementar thresholds minimos para `LOGIN`, `CANCEL_REMITTANCE` y acciones admin sensibles.
- [ ] 4.3 Envolver la deteccion en patron non-blocking para no romper el flujo principal.

## 5. Prisma update (correlationId + alerts)

- [ ] 5.1 Agregar `correlationId` nullable a `UserActionLog`.
- [ ] 5.2 Agregar el modelo minimo `UserActionAlert`.
- [ ] 5.3 Definir indices minimos para ventanas recientes, actor y correlacion.
- [ ] 5.4 Generar migracion aditiva compatible hacia atras.

## 6. Integracion en flows existentes

- [ ] 6.1 Poblar `correlationId` de forma opcional en flujos de remittance seleccionados.
- [ ] 6.2 Integrar deteccion inline en el punto de logging seguro o inmediatamente despues del registro de logs.
- [ ] 6.3 Validar que no se duplique el registro ni se afecten queries de fases 1 y 2.

## 7. Build

- [ ] 7.1 Ejecutar `npm run build`.
- [ ] 7.2 Corregir errores de Prisma, GraphQL code-first, DI o tipado asociados al MVP.

## 8. Smoke tests

- [ ] 8.1 Validar que admin obtiene el dashboard completo en una sola llamada.
- [ ] 8.2 Validar que el dashboard reusa datos existentes correctamente.
- [ ] 8.3 Validar que la alerta minima se genera al superar el threshold.
- [ ] 8.4 Validar que una falla en alert detection no rompe la accion original.
- [ ] 8.5 Validar correlacion de remittance via `correlationId`.
- [ ] 8.6 Validar que fases 1 y 2 siguen intactas.