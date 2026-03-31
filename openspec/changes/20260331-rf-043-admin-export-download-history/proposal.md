# Proposal: RF-043 Admin Report Exports - Temporary Storage, Download URL, and History

## Status

CLOSED - IMPLEMENTED - VALIDATED LOCALLY.

## Scope of this change

This change extends the already implemented RF-043 export flow for admin reports.

Current RF-043 provides:
- GraphQL query `adminExportReport`
- Export generation in memory for CSV, PDF, and EXCEL (.xlsx)
- GraphQL payload with metadata + `contentBase64`

This extension adds:
- Temporary backend file persistence for generated exports
- Temporary download URL exposed by backend
- Persistent admin export history
- Admin history query for recent exports
- Expiration policy for exports and download access

## Why this is needed

The current base64-only flow lacks:
- backend traceability of generated exports,
- reusable download URLs,
- persistent auditing of export requests,
- controlled lifecycle/expiration of exported files.

Admin operations require a backend-managed export lifecycle with minimal contract risk.

## Proposed outcome

Keep RF-043 contract compatibility while introducing the new recommended flow:

1) Keep `contentBase64` temporarily in `adminExportReport` to avoid immediate frontend breakage.
2) Add `exportId`, `downloadUrl`, and `expiresAt` to `adminExportReport` response.
3) Persist each generated export in `AdminReportExport`.
4) Store exported file in temporary local filesystem path managed by backend config.
5) Expose protected HTTP download endpoint by export id.
6) Add admin GraphQL query to list recent export history.

## Compatibility and transition policy

- Backward compatibility: existing consumers can continue using `contentBase64`.
- Recommended new flow: frontend should migrate to `downloadUrl`.
- `contentBase64` remains as transitional field in this change, not removed.
- Future change may deprecate/removal `contentBase64` once migration is complete.

## In scope

- Prisma model for admin export history
- Temporary local filesystem storage
- Download HTTP endpoint with auth + expiration checks
- GraphQL contract extension (`adminExportReport` payload + `adminReportExports` query)
- Expiration and status handling (`GENERATED`, `EXPIRED`, `FAILED`)
- Support for CSV/PDF/EXCEL unchanged

## Out of scope

- S3/blob/external storage migration
- Async export processing queue
- Scheduler-heavy cleanup pipeline
- New report datasets or semantic redesign
- Changes to submitRemittanceV2
- Changes to remittance lifecycle
- Refactors in unrelated modules

## Risks

- Local filesystem persistence is environment-dependent (ephemeral containers).
- Without advanced scheduler, cleanup is best-effort and policy-based.
- Download URL construction depends on backend public base URL config.

## Required validation

- `npm run build`
- `PORT=3001 npm run start:dev`
- verify `src/schema.gql`
- smoke: generate export, persist history, receive `downloadUrl`, download file through HTTP endpoint

## Final outcome

- Implemented and validated: RF-043 extension (temporary storage + `downloadUrl` + history).
- Real smoke executed with authenticated GraphQL and protected HTTP download URL.
- Export history persistence and listing (`adminReportExports`) validated.
- No relevant regressions observed in legacy reporting/admin flows.
