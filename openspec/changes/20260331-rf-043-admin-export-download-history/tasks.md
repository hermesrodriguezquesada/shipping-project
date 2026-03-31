# Tasks: RF-043 Extension - Download URL and Export History

## 1. OpenSpec decisions

- [x] Document compatibility decision: keep `contentBase64` transitional
- [x] Document recommended frontend flow: `downloadUrl` + history
- [x] Document scope boundaries and out-of-scope items

## 2. Data model (Prisma)

- [x] Add enum `AdminReportExportStatus` (GENERATED, EXPIRED, FAILED)
- [x] Add model `AdminReportExport`
- [x] Add indexes for requester/status/createdAt/expiresAt
- [x] Add SQL migration for new enum/table/indexes

## 3. Domain ports and adapters

- [x] Add export history port in remittances domain
- [x] Add temporary storage port in remittances domain
- [x] Implement Prisma history adapter
- [x] Implement local filesystem storage adapter
- [x] Add DI tokens and module wiring

## 4. Use-cases

- [x] Extend `AdminExportReportUseCase` to persist file + history
- [x] Add `AdminReportExportsUseCase` for history listing
- [x] Add `DownloadAdminReportExportUseCase` for controlled retrieval
- [x] Enforce TTL expiration checks and status updates

## 5. GraphQL contract

- [x] Extend `AdminReportExportPayload` with `exportId`, `downloadUrl`, `expiresAt`
- [x] Add `AdminReportExportHistoryItem` type
- [x] Add input for history listing filters (minimal)
- [x] Add query `adminReportExports`
- [x] Keep `contentBase64` field for compatibility

## 6. HTTP endpoint

- [x] Add admin-protected download controller endpoint
- [x] Stream file by export id with correct headers
- [x] Validate existence and expiration before download

## 7. Validation and smoke checks

- [x] Run `npm run prisma:generate`
- [x] Run `npm run build`
- [x] Run `PORT=3001 npm run start:dev`
- [x] Verify updated `src/schema.gql`
- [x] Smoke test: generate export returns `downloadUrl`
- [x] Smoke test: history query returns generated export
- [x] Smoke test: HTTP download works for non-expired export

## 8. Completion criteria

- [x] RF-043 compatibility preserved
- [x] New download-url/history flow operational
- [x] Minimal changes, contract-safe, and scoped

## Closure state

- CLOSED / DONE / IMPLEMENTED.
- Caveat retained by design: `contentBase64` remains for temporary compatibility while frontend migrates to `downloadUrl`.
