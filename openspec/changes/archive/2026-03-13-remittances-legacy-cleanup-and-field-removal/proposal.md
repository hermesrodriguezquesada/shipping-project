# Proposal: remittances legacy cleanup and field removal

## Breaking change acknowledgment
This change is intentionally breaking for GraphQL clients that still query legacy remittance fields:
- `destinationCupCardNumber`
- `exchangeRateRateUsed`

After this change is released, queries that still request those fields will fail GraphQL validation.

## Problem statement
A previous transitional phase introduced safe additive aliases in remittance reads:
- `owner`
- `destinationAccountNumber`
- `appliedExchangeRate`

Legacy fields were kept temporarily for backward compatibility, but now create duplicated semantics in the remittance contract and keep frontend migration incomplete.

## Why this cleanup is needed
- Remove duplicated contract surface for the same data.
- Standardize frontend/backend language on the preferred field names.
- Reduce long-term maintenance overhead in remittance mapping and docs.

## Why this must happen only after frontend migration
- This is a breaking GraphQL contract change.
- Any client still querying legacy fields will fail at schema validation.
- The cleanup phase must be gated by explicit frontend confirmation that the new fields are already adopted.

## Scope boundaries
In scope:
- Remove from `RemittanceType`:
  - `destinationCupCardNumber`
  - `exchangeRateRateUsed`
- Keep and standardize:
  - `destinationAccountNumber`
  - `appliedExchangeRate`
- Remove resolver mappings for removed legacy GraphQL fields.
- Perform evidence-based review of persisted/internal remittance fields:
  - `exchangeRateIdUsed`
  - `exchangeRateUsedAt`
  - `origin*`
- Remove persisted/internal fields only if confirmed unused by real repository usage.

Out of scope:
- No auth/guard changes.
- No unrelated module refactors.
- No speculative DB cleanup without usage proof.
- No pricing/commission redesign.

## Risk assessment
- Contract risk (high): breaking GraphQL schema for clients not yet migrated.
- Data/audit risk (medium): removing persisted snapshot fields without full usage proof can break submit/read traceability.
- Regression risk (medium): remittance read and submit flows can regress if resolver/read-model alignment is incomplete.
- Operational risk (medium): if DB columns are removed, Prisma migration sequencing must be exact and reversible.
