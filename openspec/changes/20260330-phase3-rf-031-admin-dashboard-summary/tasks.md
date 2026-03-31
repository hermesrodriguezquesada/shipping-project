# Tasks: Phase 3 RF-031 Admin Dashboard Summary

## 1. GraphQL contract

- [x] Add input `AdminDashboardSummaryInput`
- [x] Add type `AdminDashboardPeriodType`
- [x] Add type `AdminDashboardKpisType`
- [x] Add type `AdminDashboardSummaryType`
- [x] Add query `adminDashboardSummary(input)`

## 2. Resolver layer

- [x] Add resolver method for `adminDashboardSummary`
- [x] Protect query with existing admin auth + role guards
- [x] Keep all existing reporting/admin queries unchanged

## 3. Application layer

- [x] Create `AdminDashboardSummaryUseCase`
- [x] Reuse `AdminTransactionsAmountStatsUseCase` for KPI totals/count
- [x] Reuse `AdminTransactionsPeriodReportUseCase` for trend buckets
- [x] Reuse `AdminPaymentMethodUsageMetricsUseCase` for top methods
- [x] Compose consolidated response DTO

## 4. Validation and guardrails

- [x] Validate `dateFrom <= dateTo`
- [x] Validate and bound `topPaymentMethodsLimit` (default 5, max 20)
- [x] Preserve current timezone convention used by reporting foundation

## 5. Wiring

- [x] Register `AdminDashboardSummaryUseCase` in remittances module
- [x] Inject new use-case into remittances resolver

## 6. Contract safety checks

- [x] Confirm no changes to submitRemittanceV2 flow
- [x] Confirm no changes to remittance lifecycle semantics
- [x] Confirm no changes to external payment processing semantics
- [x] Confirm no implementation of RF-041/RF-042/RF-043

## 7. Validation (mandatory)

- [x] Run `npm run build`
- [x] Run `PORT=3001 npm run start:dev`
- [x] Verify `src/schema.gql` includes dashboard summary query/input/types
- [x] Run GraphQL smoke query for `adminDashboardSummary`

## 8. Completion criteria

- [x] All ACs from specs.md are satisfied
- [x] Consolidated query reuses reporting base with minimal new logic
- [x] No out-of-scope behavior implemented

## Closure state

- CLOSED / DONE / IMPLEMENTED.
