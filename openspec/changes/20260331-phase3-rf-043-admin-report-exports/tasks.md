# Tasks: Phase 3 RF-043 Admin Report Exports

## 1. GraphQL contract

- [x] Add enum `AdminReportExportFormat` (CSV, EXCEL, PDF)
- [x] Add enum `AdminReportExportDataset`
- [x] Add input `AdminReportExportInput`
- [x] Add type `AdminReportExportPayload`
- [x] Add query `adminExportReport(input)`

## 2. Application layer

- [x] Create `AdminExportReportUseCase`
- [x] Reuse existing reporting use-cases by dataset
- [x] Normalize report rows to tabular representation
- [x] Implement dataset-specific validation rules

## 3. Format rendering

- [x] Implement CSV renderer
- [x] Implement real Excel (.xlsx) renderer
- [x] Implement PDF renderer (minimal text PDF)
- [x] Produce file metadata: fileName, mimeType, sizeBytes, generatedAt

## 4. Resolver and module wiring

- [x] Add resolver method `adminExportReport`
- [x] Protect resolver with admin auth + roles
- [x] Register new use-case in remittances module

## 5. Guardrails

- [x] Ensure no changes in submitRemittanceV2/lifecycle/external-payment flows
- [x] Ensure remittance receipt PDF path is untouched
- [x] Ensure no refactors unrelated to export/reporting

## 6. Validation (mandatory)

- [x] Run `npm run build`
- [x] Run `PORT=3001 npm run start:dev`
- [x] Verify `src/schema.gql` includes export contract
- [x] Smoke test CSV export query
- [x] Smoke test PDF export query

## 7. Completion criteria

- [x] All ACs in specs.md are satisfied
- [x] Export relies on existing report foundations
- [x] No out-of-scope behavior implemented

## Closure state

- CLOSED / DONE / IMPLEMENTED.
