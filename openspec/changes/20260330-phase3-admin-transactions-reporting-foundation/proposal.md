# Proposal: Phase 3 Admin Transactions and Reporting Foundation

## Status

CLOSED - IMPLEMENTED - VALIDATED LOCALLY.

## Scope of this change

This change defines and prepares implementation for the Phase 3 backend foundation covering only:

- RF-033: Administrative consolidated view of system transactions
- RF-038: Transactions report by period (daily/weekly/monthly)
- RF-039: Aggregate sent/received amount statistics
- RF-040: Most-used payment method metrics

## Explicit in-scope decisions

- "Transaction" in this change means:
  - Remittance as the primary domain entity
  - External payments associated to each remittance as related operational info
- Reporting and admin views are backend-only contracts (GraphQL), not frontend panel implementation.

## Explicit out-of-scope

- RF-032, RF-034, RF-035, RF-036 (already considered covered in backend)
- RF-041 (requires additional functional definition)
- RF-042 (out of scope for now)
- RF-043 export (Excel/PDF) and any export pipeline
- Redesign of remittances domain
- Changes to submitRemittanceV2 flow except strict compatibility if unavoidable
- Stripe flow redesign (only admin/reporting exposure is allowed)

## Problem to solve

Current backend provides admin operational queries across users/remittances/catalogs/rates/fees, but lacks a consolidated administrative transaction view and dedicated reporting queries with period/grouping aggregates.

## Proposed outcome

Add a contract-safe reporting layer over existing remittance and external payment data with minimal-impact extensions:

1. Admin consolidated transactions listing query
2. Period-based reporting query (daily/weekly/monthly)
3. Aggregate sent/received stats query
4. Payment method usage metrics query

All new behavior must reuse existing remittance and external payment persistence models and existing admin authorization patterns.

## Why now

This provides the minimum backend foundation required to start Phase 3 administration/reporting without duplicating existing features and without forcing premature scope (geographic stats, commissions report, exports).

## Risks and dependencies

- Functional definition dependency:
  - Timezone and period boundary rules must be fixed (UTC vs local business timezone)
- Data semantics dependency:
  - Confirm whether paid/confirmed/canceled statuses are included or filtered in reporting baselines
- Contract dependency:
  - Keep compatibility with existing adminRemittances/adminRemittance behavior and current GraphQL code-first generation process

## Validation required by this change

- npm run build
- PORT=3001 npm run start:dev
- verify src/schema.gql reflects new types and queries

## Final outcome

- Implemented and validated: RF-033, RF-038, RF-039, RF-040.
- Functional smoke executed over GraphQL reporting queries.
- Legacy admin queries remained behavior-compatible.
- No relevant regressions observed in remittance submit/lifecycle flows.
