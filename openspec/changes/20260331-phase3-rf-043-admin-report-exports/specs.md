# Specs: Phase 3 RF-043 Admin Report Exports

## Scope mapping

Included:

- RF-043

Reused capabilities:

- RF-031
- RF-033
- RF-038
- RF-039
- RF-040

Excluded:

- Remittance receipt PDF behavior
- New reporting calculations

## Acceptance criteria

- [x] AC-1: Export contract exists
  - Query `adminExportReport(input)` exists.
  - Query returns file metadata and base64 content.

- [x] AC-2: Supported formats are available
  - Format enum includes CSV, EXCEL, PDF.
  - CSV and real Excel (.xlsx) export are generated.
  - PDF export is generated.

- [x] AC-3: Supported datasets reuse existing reports
  - Export supports dashboard summary, transactions, period report, amount stats, and payment method usage.
  - Data source is existing use-cases/adapters, not new aggregations.

- [x] AC-4: Filters are applied consistently
  - Required period range (`dateFrom`, `dateTo`) applies to all datasets.
  - Optional filters (`status`, `userId`, `paymentMethodCode`) are honored where applicable.

- [x] AC-5: Dataset-specific validation is enforced
  - Grouping required for period report/dashboard exports.
  - Transaction limit/offset bounds are validated.

- [x] AC-6: Query is admin-only
  - Protected with existing auth + admin role guards.

- [x] AC-7: Contract-safe behavior
  - Existing reporting queries remain compatible.
  - No remittance lifecycle/submit logic changes.
  - Remittance receipt PDF flow is untouched.

- [x] AC-8: Out-of-scope protection
  - No storage pipeline for exported files.
  - No asynchronous export jobs.
  - No frontend coupling.

- [x] AC-9: Build/runtime/schema validation passes
  - `npm run build` succeeds.
  - `PORT=3001 npm run start:dev` succeeds.
  - `src/schema.gql` includes export enums/input/output/query.

- [x] AC-10: Smoke export works
  - Admin login + export CSV returns non-empty payload.
  - Admin login + export PDF returns non-empty payload.

## Functional clarifications fixed by this spec

- RF-043 refers to administrative report exports, not remittance receipt export.
- Export payload is transport-safe via base64 and metadata.
- Excel support is generated as real `.xlsx` workbook output.

## Closure evidence and caveat

- Status: CLOSED / IMPLEMENTED / VALIDATED.
- Local validation executed: build, runtime bootstrap, schema regeneration, GraphQL smoke for exports.
- Caveat: PDF export is intentionally valid but minimalistic in rendering style.
