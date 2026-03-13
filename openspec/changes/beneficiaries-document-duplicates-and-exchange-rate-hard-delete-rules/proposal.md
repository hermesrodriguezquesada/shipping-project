# Proposal: beneficiaries document duplicates and exchange-rate hard delete rules

## Problem statement

### Beneficiaries
The frontend now needs to allow creating multiple beneficiaries for the same owner with the same `documentNumber`.

Current blocker:
- Prisma enforces `@@unique([ownerUserId, documentNumber])` on `Beneficiary`, so duplicates are rejected at persistence level.
- Create/update use-cases do not implement explicit duplicate-document business validation; they rely mostly on DB behavior.

### Exchange rates
Business rules have changed for admin exchange-rate operations:
- `adminDeleteExchangeRate` must physically delete rows.
- `adminCreateExchangeRate` must reject creating a new active row when an active row already exists for the same `from + to` pair.

Current gap:
- Delete flow behaves as soft-disable by setting `enabled=false`.
- Create flow validates currencies/rate but does not enforce active-duplicate prevention.

## Why this is a business-rule change (not a broad contract redesign)
- Existing GraphQL operations already represent the intended user actions (`createBeneficiary`, `updateBeneficiary`, `adminCreateExchangeRate`, `adminDeleteExchangeRate`).
- The required change is in persistence/validation semantics, not in introducing new API surfaces.
- Keeping contract shapes stable minimizes frontend impact and preserves backward-compatible integration points.

## Scope boundaries
In scope:
- Remove beneficiary uniqueness restriction on `(ownerUserId, documentNumber)`.
- Keep beneficiary create/update flows working without duplicate-document rejection.
- Change exchange-rate delete semantics to hard delete.
- Add explicit active-duplicate validation in `adminCreateExchangeRate`.

Out of scope:
- No auth/guard changes.
- No redesign of beneficiaries/exchange-rates module architecture.
- No unrelated filters or query redesign.
- No GraphQL contract redesign unless implementation strictly requires it.

## Risk assessment
- Data quality risk: allowing duplicate beneficiary documents may increase ambiguous records; this is accepted by the new business rule.
- Migration risk: dropping a unique constraint/index must be done safely and deterministically.
- Behavior risk: hard delete is irreversible and changes operational expectations from soft-disable semantics.
- Concurrency risk: application-layer duplicate-active checks can have race windows under concurrent create calls; acceptable for now under minimal-change scope.
