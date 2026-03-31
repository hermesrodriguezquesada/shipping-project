# Design: RF-043 Extension - Temporary Download Flow and Export History

## Design status

FINALIZED - IMPLEMENTED.

## Relationship with RF-043

This is an extension (subchange) of RF-043, not a redesign.

- RF-043 baseline remains valid (in-memory generation + base64 response).
- This change layers persistence, download URL, and history with minimal disruption.

## Architectural fit (Hexagonal)

### Domain/application additions

- Export history port for persistence/query (`AdminReportExportHistoryPort`)
- Temporary file storage port (`AdminReportExportStoragePort`)
- Use-case extension:
  - existing `AdminExportReportUseCase` orchestrates generation + storage + history persistence
- New use-case for listing history (`AdminReportExportsUseCase`)
- New use-case for controlled file download (`DownloadAdminReportExportUseCase`)

### Infrastructure adapters

- Prisma adapter implementing history port
- Local filesystem adapter implementing storage port
- HTTP controller for download endpoint

### Presentation

- GraphQL:
  - extend `AdminReportExportPayload`
  - add `AdminReportExportHistoryItem` type
  - add `adminReportExports` query
- HTTP:
  - secured endpoint to stream temporary export file

## Data model

### Prisma enum

`AdminReportExportStatus`:
- `GENERATED`
- `EXPIRED`
- `FAILED`

### Prisma model

`AdminReportExport` fields:
- `id`
- `requestedByUserId`
- `dataset`
- `format`
- `filtersJson`
- `status`
- `fileName`
- `mimeType`
- `sizeBytes`
- `storagePath`
- `expiresAt`
- `createdAt`
- `updatedAt`

Notes:
- `storagePath` keeps opaque backend-managed relative key/path.
- `filtersJson` stores normalized request filters for audit traceability.
- `requestedByUserId` is kept as scalar id (no hard relation needed for minimal scope).

## Storage strategy

- Backend local filesystem under configurable root directory.
- Safe unique naming based on export id + timestamp + extension.
- No raw filesystem path exposure in API.
- Storage root config defaults to local temp folder.

Configuration additions:
- `ADMIN_REPORT_EXPORTS_DIR` (optional; default `./tmp/admin-report-exports`)
- `ADMIN_REPORT_EXPORT_TTL_HOURS` (optional; default `24`)
- `BACKEND_PUBLIC_BASE_URL` (optional; default built from localhost + current port)

## Download endpoint

Route proposal:
- `GET /api/admin/report-exports/:id/download`

Behavior:
- Requires authenticated admin user.
- Validates export existence.
- Validates ownership/admin policy (admin role required).
- Validates expiration (`now > expiresAt` => deny and mark EXPIRED if still GENERATED).
- Streams file with proper `Content-Type` and `Content-Disposition`.
- Never exposes internal filesystem paths.

## GraphQL contract decisions

### Existing query extension

`adminExportReport(input)` keeps existing fields and adds:
- `exportId`
- `downloadUrl`
- `expiresAt`

Keep existing field for compatibility:
- `contentBase64` (transitional)

### New history query

`adminReportExports(input?)` returns list of recent exports.

Minimum fields returned:
- `id`
- `dataset`
- `format`
- `fileName`
- `mimeType`
- `sizeBytes`
- `status`
- `expiresAt`
- `createdAt`
- `downloadUrl`

Optional basic filters:
- dataset
- format
- status
- limit/offset

## Expiration and cleanup policy

- Default TTL: 24 hours from generation.
- Expired exports are non-downloadable.
- On access/listing, system can lazily mark expired records as `EXPIRED`.
- Scheduler cleanup is explicitly deferred; this change uses minimal policy + lazy enforcement.

## Frontend transition guidance

Recommended final frontend behavior:
1) call `adminExportReport`
2) use `downloadUrl` to fetch file
3) use `adminReportExports` to display history and re-download while valid

Compatibility mode remains available:
- `contentBase64` still returned during transition.

## Risks and mitigations

- Disk growth risk:
  - mitigated by TTL and local env config.
- Public URL mismatch risk:
  - mitigated with explicit `BACKEND_PUBLIC_BASE_URL` override.
- Contract confusion risk:
  - mitigated by documenting `downloadUrl` as recommended and `contentBase64` as transitional.
