# Design: remittances owner and safe field aliases

## Overview
This is a transitional, additive change for remittance reads:

1. Add sender ownership info to GraphQL remittance output.
2. Add clearer alias fields for destination account and applied exchange rate.
3. Preserve all legacy fields and persisted internal snapshot columns.

No auth/guard changes, no destructive cleanup, and no breaking contract removals are included.

## GraphQL additions

### RemittanceType.owner
- Add `owner` field sourced from remittance sender relation.
- Nullability decision: `owner: UserType!`.

Justification for non-null:
- Prisma remittance model has mandatory `senderUserId` and required `sender` relation.
- `sender` relation uses `onDelete: Cascade`, so remittances with missing sender are not expected in normal data lifecycle.
- With query adapter including sender for remittance reads, non-null is realistic and contract-clean.

### Alias fields
- Add `destinationAccountNumber: String`.
- Add `appliedExchangeRate: String`.

Legacy compatibility retained:
- Keep `destinationCupCardNumber`.
- Keep `exchangeRateRateUsed`.

## Mapping strategy

### owner mapping
- `owner` maps from `Remittance.sender` relation.
- Mapping should follow existing user GraphQL mapping conventions (reuse user mapper pattern where practical).

### Alias mappings
- `destinationAccountNumber` maps directly from existing `destinationCupCardNumber` value.
- `appliedExchangeRate` maps directly from existing `exchangeRateRateUsed` value (stringified decimal in resolver output).

## Read-path changes

### Query adapter
- Extend remittance read include to load `sender` relation in:
  - find my remittance
  - list my remittances
  - admin list/get remittances
- Extend remittance read model shape to carry sender payload needed by GraphQL owner mapping.

### Resolver mapping
- Update remittance-to-GraphQL mapper method in resolver to populate:
  - `owner`
  - `destinationAccountNumber`
  - `appliedExchangeRate`
- Keep all existing field mappings unchanged.

## Internal field review notes (documented, not removed)
- `exchangeRateIdUsed` remains persisted/internal for traceability.
- `exchangeRateUsedAt` remains persisted/internal for traceability.
- `origin*` fields remain unchanged because discovery confirms end-to-end usage.

These are explicitly follow-up cleanup candidates after frontend migration.

## Out of scope
- Removal of legacy GraphQL fields (`destinationCupCardNumber`, `exchangeRateRateUsed`).
- Removal of `origin*` GraphQL fields.
- Prisma destructive cleanup of snapshot/internal columns.
- Renaming persisted DB columns.
