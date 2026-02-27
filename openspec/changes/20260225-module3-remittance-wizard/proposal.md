## Why

Módulo 3 (wizard de remesa) requiere completar un flujo end-to-end contract-safe sobre el modelo actual.
Hoy solo existen setters parciales (`setRemittanceAmount`, `setRemittanceOriginAccount`) y no existe operación para iniciar, completar y enviar una remesa como wizard.

Además, el estado real del dominio impone restricciones que este cambio debe respetar:

- `Remittance.amount` y `Remittance.beneficiaryId` son `NOT NULL`.
- `Remittance.status` tiene default `SUBMITTED` y **no se debe cambiar** en este change.
- No existen queries/tipos GraphQL de remesa.

## Scope

Completar RF-014..RF-017 con cambios mínimos y sin refactors:

1. Crear remesa draft con integridad DB (`beneficiaryId` requerido y `amount` inicial válido).
2. RF-014: setear método de recepción usando catálogo estático por enum.
3. RF-015: exigir tarjeta destino para `CUP_TRANSFER`.
4. RF-016: setear titular de cuenta origen (`PERSON`/`COMPANY`) con validaciones por tipo.
5. RF-017: `submitRemittance` con validación integral y creación de `Transfer(PENDING)` si no existe.

## Fixed Decisions (mandatory)

- No cambiar nullability de `Remittance.amount` ni `Remittance.beneficiaryId`.
- No cambiar default de `Remittance.status` en Prisma.
- `createRemittanceDraft(beneficiaryId: ID!)` crea remesa con:
  - `status = DRAFT` explícito.
  - `amount` inicial en valor válido (mínimo permitido del sistema).
- Catálogo RF-014 por enum:
  - `USD_CASH`, `CUP_CASH`, `CUP_TRANSFER`, `MLC`, `USD_CLASSIC`.
- RF-015:
  - si `receptionMethod = CUP_TRANSFER` => `destinationCupCardNumber` requerido.
- RF-016:
  - `OriginAccountHolderType = PERSON | COMPANY`.
  - `PERSON` => `firstName + lastName` requeridos.
  - `COMPANY` => `companyName` requerido.
- RF-017 submit valida: ownership, estado `DRAFT`, monto min/max (RF-013), cuenta origen (RF-012), método recepción, titular y tarjeta CUP cuando aplique; si pasa, `status=SUBMITTED` y crea `Transfer(PENDING)` si no existe.

## Out of Scope

- No refactors arquitectónicos.
- No cambios en módulos ajenos a remittances salvo wiring/config estrictamente necesaria.
- No nuevas capacidades de admin ni backoffice.
- No cambio de defaults existentes fuera de lo explícitamente definido en este change.