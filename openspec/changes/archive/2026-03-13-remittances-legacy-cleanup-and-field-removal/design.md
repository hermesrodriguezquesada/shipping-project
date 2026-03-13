# Design: remittances legacy cleanup and field removal

## Overview
This change executes the destructive cleanup phase after alias adoption:
1. Remove legacy GraphQL remittance fields that now have safe replacements.
2. Keep preferred fields as the only supported contract.
3. Review persisted/internal fields and remove only if repository usage confirms they are unused.

This change remains strictly scoped to remittances.

## GraphQL contract cleanup

### Legacy fields to remove from `RemittanceType`
- `destinationCupCardNumber`
- `exchangeRateRateUsed`

### Preferred fields that remain
- `destinationAccountNumber`
- `appliedExchangeRate`

Mapping strategy after cleanup:
- `destinationAccountNumber` remains mapped from persisted destination account storage.
- `appliedExchangeRate` remains mapped from persisted applied exchange-rate snapshot storage.

## Evidence-based review of persisted/internal fields

Review rule:
- Remove only when confirmed unused in submit/lifecycle/read paths.
- If any active usage exists, field stays out of scope for deletion in this change.

| Field | Decision | Evidence from repository usage |
|---|---|---|
| `exchangeRateIdUsed` | keep (still used) | Written during submit (`submit-remittance-v2.usecase.ts`), passed in remittance command port/adapter, and defined in remittance query model + Prisma relation (`Remittance.exchangeRateUsed`). |
| `exchangeRateUsedAt` | keep (still used) | Written during submit (`new Date()` in submit use case), passed through command port/adapter, and part of remittance query model/Prisma schema. |
| `originZelleEmail` | keep (still used) | Set from submit origin account path, persisted in command adapter, exposed in remittance query model and GraphQL type/resolver output. |
| `originIban` | keep (still used) | Same active path as `originZelleEmail` across submit -> command -> read -> GraphQL output. |
| `originStripePaymentMethodId` | keep (still used) | Same active path as `originZelleEmail` across submit -> command -> read -> GraphQL output. |
| `originAccountHolderType` | keep (still used) | Required in submit input/validation and persisted/remapped in remittance read output; also used by pricing/commission flows as enum domain concept. |
| `originAccountHolderFirstName` | keep (still used) | Produced by holder validation in submit flow, persisted in command adapter, and exposed in remittance read GraphQL output. |
| `originAccountHolderLastName` | keep (still used) | Produced by holder validation in submit flow, persisted in command adapter, and exposed in remittance read GraphQL output. |
| `originAccountHolderCompanyName` | keep (still used) | Produced by holder validation in submit flow, persisted in command adapter, and exposed in remittance read GraphQL output. |

Conclusion for this change:
- No persisted/internal remittance fields above are removed because all are still used by active code paths.

## Resolver/read-model/query-adapter impacts
- Remove legacy output properties from `RemittanceType` definition.
- Remove resolver assignments for:
  - `destinationCupCardNumber`
  - `exchangeRateRateUsed`
- Keep existing resolver assignments for:
  - `owner`
  - `destinationAccountNumber`
  - `appliedExchangeRate`
- Keep read-model and query-adapter data required to support preferred fields and still-used internal fields.

## Prisma migration impact
- Expected for this change: no Prisma schema or migration changes for internal fields.
- If later evidence confirms any internal field becomes unused, removal must be done in a dedicated follow-up migration with explicit data retention policy.

## Out of scope
- Auth/guard changes.
- Removal of still-used origin/snapshot persistence fields.
- Pricing/commission domain changes.
- Any non-remittances cleanup.
