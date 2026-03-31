# Design: Phase 3 RF-043 Admin Report Exports

## Design status

FINALIZED - IMPLEMENTED.

## Requirement coverage

This design covers only:

- RF-043

This design reuses:

- RF-031 (dashboard summary)
- RF-033 (transactions list)
- RF-038 (period report)
- RF-039 (amount stats)
- RF-040 (payment method usage metrics)

Out of scope:

- Remittance receipt PDF flow
- New reporting semantics
- Export storage/batch systems

## Goal

Provide one admin-only backend export contract that serializes existing administrative reporting outputs to CSV, real Excel (.xlsx), or PDF with minimal new logic.

## Contract proposal

### Query

- `adminExportReport(input: AdminReportExportInput!): AdminReportExportPayload!`

### Input

`AdminReportExportInput`

- `dataset: AdminReportExportDataset!`
- `format: AdminReportExportFormat!` (CSV | EXCEL | PDF)
- `dateFrom: DateTime!`
- `dateTo: DateTime!`
- `grouping: AdminReportGrouping` (required for period/dashboard datasets)
- `status: RemittanceStatus` (optional)
- `userId: ID` (optional)
- `paymentMethodCode: String` (optional)
- `limit: Int` (optional, transactions export)
- `offset: Int` (optional, transactions export)
- `topPaymentMethodsLimit: Int` (optional, dashboard export)

### Output

`AdminReportExportPayload`

- `dataset: AdminReportExportDataset!`
- `format: AdminReportExportFormat!`
- `fileName: String!`
- `mimeType: String!`
- `contentBase64: String!`
- `sizeBytes: Int!`
- `generatedAt: DateTime!`

## Dataset strategy

The export use-case orchestrates existing report use-cases and transforms output into tabular lines:

- `DASHBOARD_SUMMARY` → `AdminDashboardSummaryUseCase`
- `TRANSACTIONS` → `AdminTransactionsUseCase`
- `PERIOD_REPORT` → `AdminTransactionsPeriodReportUseCase`
- `AMOUNT_STATS` → `AdminTransactionsAmountStatsUseCase`
- `PAYMENT_METHOD_USAGE` → `AdminPaymentMethodUsageMetricsUseCase`

No new aggregation semantics are introduced.

## Format rendering strategy

### CSV

- UTF-8 text
- comma separated values
- quoted escaping for commas/quotes/newlines
- mime: `text/csv; charset=utf-8`

### EXCEL

- Real Excel workbook generation (.xlsx)
- mime: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- file extension: `.xlsx`

### PDF

- Text-based PDF generated with the existing minimal PDF approach (no new external libs)
- Includes title, generation metadata, and rows
- mime: `application/pdf`

## Validation rules

- `dateFrom <= dateTo`
- `dataset` and `format` required
- grouping required for `DASHBOARD_SUMMARY` and `PERIOD_REPORT`
- limit/offset bounds for `TRANSACTIONS`

## Authorization and compatibility

- Export query is admin-only via existing guards/roles.
- Existing queries remain unchanged.
- No changes in remittance submit/lifecycle/external-payment behavior.
- No dependency on frontend-specific download flows.

## Required validation

- npm run build
- PORT=3001 npm run start:dev
- verify schema contains export enums/input/output/query
- smoke test export for at least CSV and PDF
