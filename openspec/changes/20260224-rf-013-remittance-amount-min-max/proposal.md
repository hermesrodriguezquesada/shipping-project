## Why

RF-013 requiere que el backend permita setear/actualizar el monto de una remesa existente con validaciones de mínimo y máximo.
Actualmente el contrato GraphQL no expone ninguna operación de monto para remittance/transfer, por lo que no existe una vía contract-safe para cumplir este requisito.

## Scope

- Aplicar RF-013 sobre `Remittance` (no `Transfer`).
- Exponer una mutación mínima nueva para setear monto en remesa existente.
- Validar monto por reglas de negocio:
  - `amount > 0`
  - `amount >= MIN`
  - `amount <= MAX`
- Configurar límites con env vars opcionales:
  - `REMITTANCE_AMOUNT_MIN`
  - `REMITTANCE_AMOUNT_MAX`

## Out of Scope

- No refactors arquitectónicos.
- No cambios en flujos de auth/roles/tokens/sesiones.
- No cambios en lógica de transfer provider.
- No nuevas queries de remittance.

## Risks

- Drift GraphQL/Prisma si no se valida el contrato code-first.
- Inconsistencia de límites si no se definen defaults explícitos.
- Riesgo de precisión de monto en GraphQL al no tener scalar Decimal expuesto.

## Minimal Contract-Safe Approach

- Se mantiene `Remittance.amount` en Prisma (`Decimal`) y se agrega una mutación mínima:
  - `setRemittanceAmount(input: SetRemittanceAmountInput!): Boolean!`
- Como no existe scalar GraphQL Decimal en el contrato actual, el input de `amount` se define como `String!` para preservar precisión y permitir parseo a `Decimal` en aplicación.
