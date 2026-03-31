# Specs: RF-043 Extension - Download URL and Export History

## Scope mapping

Included:
- RF-043 extension for temporary persistence, download URL, and history

Reused:
- Existing RF-043 export generation contract and datasets

Excluded:
- submitRemittanceV2 flow changes
- remittance lifecycle changes
- new report dataset semantics
- external object storage migration

## Acceptance criteria

- [x] AC-1: Existing RF-043 export generation remains functional
  - `adminExportReport` still generates CSV/PDF/EXCEL.
  - Existing dataset behavior remains unchanged.

- [x] AC-2: Backward compatibility is preserved
  - `contentBase64` remains in `adminExportReport` payload.
  - Existing consumers are not forced to migrate immediately.

- [x] AC-3: New export metadata is returned
  - `adminExportReport` includes `exportId`, `downloadUrl`, and `expiresAt`.

- [x] AC-4: Export history is persisted
  - Each successful export creates `AdminReportExport` record.
  - Record includes requester, dataset, format, filters, status, file metadata, path, and expiration.

- [x] AC-5: Temporary file is stored in backend filesystem
  - File is written to configured temp directory.
  - Path/naming is backend-controlled and unique.

- [x] AC-6: Temporary download endpoint exists and is protected
  - Endpoint resolves export by id.
  - Requires admin authorization.
  - Returns correct filename + mime type.
  - Rejects expired exports.

- [x] AC-7: Export history query exists
  - `adminReportExports` returns recent exports with status and download URL.

- [x] AC-8: Expiration policy is enforced
  - Exports have TTL-based `expiresAt`.
  - Expired exports become non-downloadable.
  - Status can transition to `EXPIRED` by lazy checks.

- [x] AC-9: Contract-safe and minimal changes
  - No changes to remittance submit/lifecycle logic.
  - No refactor in unrelated modules.

- [x] AC-10: Mandatory validation passes
  - `npm run build`
  - `PORT=3001 npm run start:dev`
  - `src/schema.gql` reflects new GraphQL contract

## Design decisions fixed by spec

- This is an RF-043 extension/subchange, not replacement.
- Final recommended frontend contract is download URL + history.
- `contentBase64` remains transitional for controlled migration.
- Storage is temporary local filesystem in this phase.

## Closure evidence and caveats

- Status: CLOSED / IMPLEMENTED / VALIDATED.
- Local validation executed: build, runtime bootstrap, schema regeneration, GraphQL smoke, and protected HTTP download smoke.
- Caveat: `contentBase64` remains available by compatibility policy; frontend recommended flow is `downloadUrl` + history.
