# Proposal: remittances owner and safe field aliases

## Problem statement
The frontend requested remittance-read improvements that are currently missing in GraphQL:

- Remittance output should include the user who created the remittance.
- `destinationCupCardNumber` should have a generic alias suitable for future non-CUP account destinations.
- `exchangeRateRateUsed` should have a clearer name.

At the same time, the codebase still uses several existing remittance fields end-to-end, including `origin*` fields and persisted exchange-rate snapshot fields (`exchangeRateIdUsed`, `exchangeRateUsedAt`).

## Why owner info is needed
- Frontend needs explicit ownership context directly in remittance payloads (`myRemittance`, `myRemittances`, `adminRemittance`, `adminRemittances`).
- Owner information improves timeline/history views and avoids additional user lookups by remittance sender id.

## Why generic/clearer aliases are needed
- `destinationCupCardNumber` is too domain-specific for evolving destination account strategies.
- `exchangeRateRateUsed` is redundant wording and less readable for frontend developers.
- Additive aliases allow frontend migration to clearer names without blocking current integrations.

## Why direct renames/removals are deferred
- Renaming/removing existing fields in this step would break current GraphQL consumers.
- Discovery confirms legacy fields are still used end-to-end.
- A staged migration is safer: add aliases now, deprecate/remove in a later cleanup change after frontend adoption.

## Scope boundaries
In scope:
- Add `owner` to `RemittanceType`.
- Add alias fields:
  - `destinationAccountNumber`
  - `appliedExchangeRate`
- Keep legacy fields untouched:
  - `destinationCupCardNumber`
  - `exchangeRateRateUsed`
  - `origin*`
- Document internal persisted field cleanup candidates without deleting schema fields.

Out of scope:
- No auth/guard changes.
- No destructive Prisma cleanup.
- No removal/rename of DB columns.
- No removal of legacy GraphQL remittance fields in this change.

## Risk assessment
- Data-shape risk: adding `owner` introduces relation mapping dependency in all remittance read paths.
- Naming transition risk: temporary coexistence of legacy + alias fields can cause short-term duplication/confusion; mitigated by clear frontend migration guidance.
- Regression risk: remittance resolver/query adapter updates must preserve existing fields and semantics.
- Scope risk: cleanup pressure may tempt removals; explicitly deferred to follow-up after frontend migration.
