# Design: Phase 3 RF-031 Admin Dashboard Summary

## Design status

FINALIZED - IMPLEMENTED.

## Requirement coverage

This design covers only:

- RF-031

This design reuses foundations from:

- RF-033
- RF-038
- RF-039
- RF-040

Out of scope:

- RF-041
- RF-042
- RF-043
- Frontend dashboard layout/UX

## Goal

Expose a single admin-only backend query that returns a consolidated KPI summary for a selected period, while preserving existing contracts and reusing already implemented reporting logic.

## Query contract proposal

### Query name

- `adminDashboardSummary(input: AdminDashboardSummaryInput!): AdminDashboardSummaryType!`

### Input

`AdminDashboardSummaryInput`

- `dateFrom: DateTime!`
- `dateTo: DateTime!`
- `grouping: AdminReportGrouping!` (DAILY/WEEKLY/MONTHLY, for trend section)
- `status: RemittanceStatus` (optional)
- `userId: ID` (optional)
- `paymentMethodCode: String` (optional)
- `topPaymentMethodsLimit: Int` (optional, bounded, default 5)

### Output

`AdminDashboardSummaryType`

- `kpis: AdminDashboardKpisType!`
- `periodTrend: [AdminTransactionsPeriodBucketType!]!`
- `topPaymentMethods: [AdminPaymentMethodUsageMetricType!]!`
- `period: AdminDashboardPeriodType!`
- `timezone: String!`

`AdminDashboardKpisType`

- `totalTransactions: Int!`
- `totalPaymentAmount: String!`
- `totalReceivingAmount: String!`

`AdminDashboardPeriodType`

- `dateFrom: DateTime!`
- `dateTo: DateTime!`
- `grouping: AdminReportGrouping!`

## KPI definitions

- `totalTransactions`
  - Definition: number of remittances matching all filters in selected period.
  - Source: `adminTransactionsAmountStats.remittanceCount` (RF-039).

- `totalPaymentAmount`
  - Definition: sum of remittance payment amounts matching filters.
  - Source: `adminTransactionsAmountStats.totalPaymentAmount` (RF-039).

- `totalReceivingAmount`
  - Definition: sum of remittance receiving amounts matching filters.
  - Source: `adminTransactionsAmountStats.totalReceivingAmount` (RF-039).

- `periodTrend`
  - Definition: transaction counts grouped by selected grouping.
  - Source: `adminTransactionsPeriodReport` (RF-038).

- `topPaymentMethods`
  - Definition: payment method ranking by usage count in period; include amount.
  - Source: `adminPaymentMethodUsageMetrics` (RF-040), sorted by usageCount desc and truncated by limit.

## Reuse strategy

The consolidated query should orchestrate existing application services instead of adding new persistence semantics.

Preferred reuse approach:

1. Create `AdminDashboardSummaryUseCase` in application layer.
2. Internally call existing use-cases:
   - `AdminTransactionsAmountStatsUseCase`
   - `AdminTransactionsPeriodReportUseCase`
   - `AdminPaymentMethodUsageMetricsUseCase`
3. Assemble a consolidated DTO for GraphQL output.

This keeps Prisma adapter changes minimal and avoids duplicating aggregate logic.

## Validation rules

- `dateFrom <= dateTo`.
- `topPaymentMethodsLimit` bounded (`1..20`, default 5).
- `grouping` required.
- Reuse same timezone convention already used in reporting foundation (UTC unless future change defines otherwise).

## Authorization and safety

- Query must be admin-only via existing guards/roles.
- No mutation behavior changes.
- Existing reporting queries remain unchanged and available.
- No changes to submit/lifecycle/external payment processing flows.

## Performance considerations

- Execute independent aggregate reads in parallel where possible.
- Avoid fetching full transaction lists for summary metrics.
- Keep top methods capped to avoid oversized payloads.

## Required validation

- npm run build
- PORT=3001 npm run start:dev
- verify src/schema.gql includes dashboard summary input/output/query
- smoke query `adminDashboardSummary` with realistic period filters
