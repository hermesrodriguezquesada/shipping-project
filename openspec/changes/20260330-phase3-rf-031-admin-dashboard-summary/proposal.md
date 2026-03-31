# Proposal: Phase 3 RF-031 Admin Dashboard Summary

## Status

CLOSED - IMPLEMENTED - VALIDATED LOCALLY.

## Scope of this change

This change defines and implements RF-031 from Phase 3 with a minimal, contract-safe backend scope:

- Add a consolidated admin dashboard query: `adminDashboardSummary`
- Reuse reporting capabilities already implemented for:
  - RF-033 (admin transactions listing)
  - RF-038 (transactions by period)
  - RF-039 (aggregate sent/received amounts)
  - RF-040 (payment method usage metrics)

## Context assumptions

- RF-032, RF-034, RF-035, RF-036 are already considered covered.
- RF-041 is explicitly out of scope in this change.
- RF-042 is explicitly out of scope in this change.
- This change must remain backend-contract focused and frontend-agnostic.

## Problem to solve

Admin clients need a single query that returns key operational and business KPIs for a selected period, without forcing frontend clients to orchestrate multiple reporting queries and merge partial responses.

## Proposed outcome

Expose `adminDashboardSummary(input)` as an admin-only GraphQL query that returns a normalized KPI summary composed from existing reporting foundations.

Expected benefits:

1. Single backend contract for dashboard KPI consumption.
2. KPI definitions centralized in backend (consistent calculations).
3. Reuse of existing use-cases/adapters with minimal additional logic.
4. No breaking changes to existing reporting and remittance contracts.

## KPI baseline included in this change

The consolidated summary MUST include at least:

- `totalTransactions`: count of remittances in the filtered period.
- `totalPaymentAmount`: sum of payment amounts in the filtered period.
- `totalReceivingAmount`: sum of receiving amounts in the filtered period.
- `periodTransactionTrend`: bucketed transaction counts by grouping (DAILY/WEEKLY/MONTHLY).
- `topPaymentMethods`: usage ranking by payment method with count and amount.

## Risks and dependencies

- KPI semantics dependency: inclusion/exclusion of statuses must remain explicit and filter-driven.
- Time semantics dependency: period boundaries and grouping timezone must remain deterministic.
- Performance dependency: consolidated query must avoid unnecessary duplicated reads.

## Validation required by this change

- npm run build
- PORT=3001 npm run start:dev
- verify src/schema.gql reflects dashboard summary contract
- run at least one GraphQL smoke query for adminDashboardSummary

## Final outcome

- Implemented and validated: RF-031 (`adminDashboardSummary`).
- GraphQL smoke executed successfully for consolidated dashboard summary.
- Reuse of RF-033/RF-038/RF-039/RF-040 confirmed.
- No regression observed in legacy queries and remittance critical flows.
