# Tasks: Phase 3 Admin Transactions and Reporting Foundation

## 1. Contract design in GraphQL (code-first)

- [x] Add enum `AdminReportGrouping` (DAILY/WEEKLY/MONTHLY)
- [x] Add input `AdminTransactionsFilterInput`
- [x] Add input `AdminTransactionsPeriodReportInput`
- [x] Add input `AdminTransactionsAmountStatsInput`
- [x] Add input `AdminPaymentMethodUsageInput`
- [x] Add type `AdminExternalPaymentSummaryType`
- [x] Add type `AdminTransactionType`
- [x] Add type `AdminTransactionsPeriodBucketType`
- [x] Add type `AdminTransactionsAmountStatsType`
- [x] Add type `AdminPaymentMethodUsageMetricType`

## 2. Resolver layer (admin + reporting)

- [x] Add query `adminTransactions(input)`
- [x] Add query `adminTransactionsPeriodReport(input)`
- [x] Add query `adminTransactionsAmountStats(input)`
- [x] Add query `adminPaymentMethodUsageMetrics(input)`
- [x] Protect all new queries with existing admin guards/roles
- [x] Keep existing adminRemittances/adminRemittance untouched

## 3. Application use-cases

- [x] Create `AdminTransactionsListUseCase`
- [x] Create `AdminTransactionsPeriodReportUseCase`
- [x] Create `AdminTransactionsAmountStatsUseCase`
- [x] Create `AdminPaymentMethodUsageMetricsUseCase`
- [x] Add input validation (dateFrom/dateTo, grouping, optional filters)

## 4. Ports and adapters

- [x] Extend remittance query port for filtered listing and reporting aggregates
- [x] Add method(s) to resolve latest associated external payment summary per remittance
- [x] Implement Prisma adapter queries for:
  - [x] consolidated filtered admin listing
  - [x] grouped period counts
  - [x] aggregate sent/received amounts
  - [x] payment method usage counts

## 5. Module wiring

- [x] Register new use-cases and providers in the relevant module(s)
- [x] Wire resolver dependencies without changing unrelated modules

## 6. Scope guardrails and compatibility

- [x] Confirm no redesign of remittances domain
- [x] Confirm no modifications to submitRemittanceV2 business behavior (except strict compatibility if needed)
- [x] Confirm no Stripe flow redesign (read/reporting only)
- [x] Confirm no implementation of RF-041, RF-042, RF-043

## 7. Validation (mandatory)

- [x] Run `npm run build`
- [x] Run `PORT=3001 npm run start:dev`
- [x] Verify `src/schema.gql` includes all new enums/inputs/types/queries

## 8. Functional verification checklist

- [x] Verify adminTransactions returns remittance-centric records with optional external payment summary
- [x] Verify filters (date range, status, userId, paymentMethodCode) are applied correctly
- [x] Verify period report grouping works for DAILY/WEEKLY/MONTHLY
- [x] Verify amount stats are consistent with filtered remittances
- [x] Verify payment method usage metrics are consistent with filtered remittances
- [x] Verify legacy admin queries remain behavior-compatible

## 9. Final completion criteria

- [x] All ACs from specs.md are satisfied
- [x] No out-of-scope behavior implemented
- [x] Contract is generated and validated in schema.gql

## Closure state

- CLOSED / DONE / IMPLEMENTED.
