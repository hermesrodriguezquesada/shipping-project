# Tasks: backend contract V2 remittance cleanup

## Implementation
- [x] Add GraphQL input objects for `SubmitRemittanceV2Input` and nested payload sections.
- [x] Implement `SubmitRemittanceV2UseCase` with full validations and pricing/fx snapshot orchestration.
- [x] Add command-port support for one-shot remittance creation in `PENDING_PAYMENT`.
- [x] Wire resolver mutation `submitRemittanceV2` and return `RemittanceType` read model.
- [x] Keep legacy wizard mutations and mark selected operations deprecated.
- [x] Ensure `register` remains aligned with full `AuthPayload` including refresh token.

## Contract cleanup
- [x] Remove `transfer` from remittance GraphQL type.
- [x] Remove `exchangeRateUsedAt` from remittance GraphQL type.
- [x] Add `paymentAmount`, `receivingAmount`, `feesBreakdownJson` to remittance GraphQL type.
- [x] Keep duplicated fields only as deprecated compatibility aliases where required.

## Persistence
- [x] Remove Prisma `Transfer` model/relation and enum.
- [x] Add `feesBreakdownJson` column to `Remittance`.
- [x] Add migration SQL for DB alignment.
- [ ] Apply migration locally with `npx prisma migrate dev` (interactive in current terminal environment).
- [x] Regenerate Prisma client (`npx prisma generate`).

## Verification and rollout
- [x] Build app (`npm run build`).
- [x] Validate startup command (`PORT=3001 npm run start:dev`) and record output.
- [x] Regenerate GraphQL schema through build/start flow.
- [x] Prepare QA GraphQL snippets with placeholders (`<ACCESS_TOKEN>`, `<ADMIN_TOKEN>`, `<BEN_ID>`, `<RID>`).
- [ ] Remove legacy wizard mutations after compatibility window (target: 2026-06-30).
