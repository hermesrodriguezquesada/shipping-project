# Tasks: beneficiaries document duplicates and exchange-rate hard delete rules

## Implementation checklist
- [x] 1) Update Prisma schema
  - remove Beneficiary unique constraint on `(ownerUserId, documentNumber)`

- [x] 2) Create migration
  - drop unique index/constraint safely

- [x] 3) Update beneficiaries flow only if any code assumes unique `documentNumber`

- [x] 4) Update exchange-rates command behavior
  - `adminDeleteExchangeRate` performs hard delete

- [x] 5) Update adminCreateExchangeRate validation
  - reject duplicate active `from+to`

- [x] 6) Regenerate/validate:
  - `npm run build`
  - `PORT=3001 npm run start:dev`
  - verify `src/schema.gql` remains consistent

- [x] 7) Smoke tests:
  - create two beneficiaries with same `documentNumber` for same owner -> both succeed
  - create active exchange rate for `from/to`, then try creating another active same pair -> fails
  - disable existing active rate (or use a disabled row) then create new active same pair -> succeeds
  - `adminDeleteExchangeRate` physically removes the row

## Constraints reminder
- Do not change auth/guards.
- Keep GraphQL code-first and avoid unnecessary contract changes.
- Do not add new dedup logic for beneficiaries beyond removing uniqueness restriction.
- Keep changes minimal and scoped.
