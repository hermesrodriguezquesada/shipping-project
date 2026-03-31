# Proposal: Phase 3 RF-043 Admin Report Exports

## Status

CLOSED - IMPLEMENTED - VALIDATED LOCALLY.

## Scope of this change

This change implements RF-043 for administrative reporting export with minimal-impact backend scope:

- Export administrative reports to CSV/Excel
- Export administrative reports to PDF

This change is strictly for aggregated/admin reporting exports.

## Context assumptions

- Reporting foundations already exist (RF-033, RF-038, RF-039, RF-040, and dashboard summary RF-031).
- Existing remittance receipt PDF is unrelated and must not be treated as RF-043 coverage.
- This change remains backend contract focused and frontend-agnostic.

## Problem to solve

Admin clients need a backend capability to export existing report data in common document formats without reimplementing report aggregation logic in frontend clients.

## Proposed outcome

Add one admin-only GraphQL export query that reuses existing report use-cases and returns file payload metadata + base64 content for download.

Proposed high-level contract:

- `adminExportReport(input: AdminReportExportInput!): AdminReportExportPayload!`

Export formats in scope:

- CSV
- EXCEL (real .xlsx workbook)
- PDF

## In-scope datasets for export

Reuse existing report/query foundations, no new report semantics:

- Dashboard summary (RF-031)
- Transactions list (RF-033)
- Period trend report (RF-038)
- Amount stats (RF-039)
- Payment method usage metrics (RF-040)

## Explicit out-of-scope

- New business KPIs or new aggregation semantics
- Remittance receipt PDF redesign
- File storage pipelines (S3, blob storage)
- Async batch jobs or scheduled exports
- Refactors outside reporting/export path

## Risks and dependencies

- Payload size risk for large datasets (especially transactions list).
- Format consistency risk across CSV/Excel/PDF renderers.
- Filter semantics must remain aligned with existing report use-cases.

## Validation required by this change

- npm run build
- PORT=3001 npm run start:dev
- verify src/schema.gql includes export contract
- smoke test admin login + export query for CSV and PDF

## Final outcome

- Implemented and validated: RF-043 base export flow.
- Formats validated: CSV, PDF, EXCEL (.xlsx).
- GraphQL smoke executed for export generation and metadata payload.
- Compatibility preserved for `contentBase64`.
