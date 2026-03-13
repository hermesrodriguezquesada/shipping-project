# Tasks: remittances legacy cleanup and field removal

## Implementation checklist
- [x] 1) Confirm frontend migration to new alias fields.

- [x] 2) Remove legacy GraphQL fields from `RemittanceType`:
  - `destinationCupCardNumber`
  - `exchangeRateRateUsed`

- [x] 3) Remove resolver mappings for removed legacy fields.

- [x] 4) Review persisted/internal fields usage:
  - `exchangeRateIdUsed`
  - `exchangeRateUsedAt`
  - `origin*`

- [x] 5) If confirmed unused, remove those fields from:
  - Prisma schema
  - create/use-case mapping
  - query/read models
  - GraphQL outputs if exposed
  - migrations
  - Result in this change: not applicable, fields remain because active repository usage was confirmed.

- [x] 6) Build and regenerate schema:
  - `npm run build`
  - `PORT=3001 npm run start:dev`
  - verify `src/schema.gql`

- [x] 7) Smoke tests:
  - `myRemittance`
  - `myRemittances`
  - `adminRemittance`
  - `adminRemittances`
  - `adminRemittancesByUser`
  validating that:
  - `owner` remains present
  - `destinationAccountNumber` works
  - `appliedExchangeRate` works
  - legacy fields are no longer queryable

- [x] 8) Negative schema validation:
  - querying `destinationCupCardNumber` should fail
  - querying `exchangeRateRateUsed` should fail
