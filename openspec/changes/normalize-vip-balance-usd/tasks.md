## 1. VIP Payment Proof — USD conversion on confirm

- [x] 1.1 Add `VIP_EXCHANGE_RATE_QUERY_PORT` injection to `AdminConfirmVipPaymentProofUseCase` constructor
- [x] 1.2 Implement `resolveAmountUsd(amount, currencyCode, vipExchangeRateQuery)` helper in the use case: USD no-op, `from→USD` multiply, `USD→from` divide, else throw `ValidationDomainException`
- [x] 1.3 Call `resolveAmountUsd` in `AdminConfirmVipPaymentProofUseCase.execute` before calling `command.confirmPending`, passing the resolved `amountUsd`
- [x] 1.4 Update `VipPaymentProofCommandPort.confirmPending` signature to accept `amountUsd: Prisma.Decimal` instead of deriving it from the stored proof amount
- [x] 1.5 Update `PrismaVipPaymentProofCommandAdapter.confirmPending` to use the passed `amountUsd` for the `totalGeneratedAmount { increment }` call
- [x] 1.6 Update `vip-payment-proofs.module.ts` to import `VipPricingModule` (or directly provide `VipExchangeRateQueryPort`) so the new dependency is available via DI

## 2. Payment Requests — sumActiveAmountsUsd

- [x] 2.1 Rename `sumActiveAmounts` to `sumActiveAmountsUsd` in `PaymentRequestQueryPort` interface
- [x] 2.2 Rename the method in `PrismaPaymentRequestQueryAdapter`: change implementation from `aggregate._sum.amount` to fetch all active rows with `select: { amount, exchangeRate }`, reduce with `Σ(amount / exchangeRate)`, return `Prisma.Decimal`
- [x] 2.3 Update `CreatePaymentRequestUseCase` to call `query.sumActiveAmountsUsd` (rename only — logic already uses the result correctly as USD)

## 3. Payment Requests — USD decrement on complete

- [x] 3.1 In `PrismaPaymentRequestCommandAdapter.completeAndDecrementBalance`, after re-fetching `request`, add `const effectiveAmountUsd = effectiveAmount.div(request.exchangeRate)`
- [x] 3.2 Replace `totalGeneratedAmount: { decrement: effectiveAmount }` with `totalGeneratedAmount: { decrement: effectiveAmountUsd }`
- [x] 3.3 Update the balance guard: `user.totalGeneratedAmount.lt(effectiveAmountUsd)` (was `effectiveAmount`)
- [x] 3.4 Re-fetch `exchangeRate` along with `newAmount` and `amount` in the `findUnique` call inside the transaction (add `exchangeRate` to `select`)

## 4. Remittances — decouple from VIP balance

- [x] 4.1 Remove the `await tx.user.update({ totalGeneratedAmount: { increment } })` block from `PrismaRemittanceCommandAdapter.confirmPayment` (including the `tx.remittance.findUnique` used only to get `senderUserId` and `amount` for that increment)
- [x] 4.2 Simplify `confirmPayment` to a single `$transaction` that only updates `Remittance.status → PAID_SENDING_TO_RECEIVER` using `updateMany` — if no longer needing the inner `findUnique`, the `$transaction` wrapper can be removed (idempotency is still via `updateMany` count check)
- [x] 4.3 Update the JSDoc comment in `ExternalPaymentAcceptanceUseCase` to remove the `- totalGeneratedAmount increment` bullet

## 5. Unit tests

- [ ] 5.1 Add unit test to `admin-confirm-vip-payment-proof.usecase.spec.ts`: USD proof increments `amountUsd = amount`
- [ ] 5.2 Add unit test: CUP proof with `USD→CUP` rate 200, `amount = 20000` → increment `100`
- [ ] 5.3 Add unit test: EUR proof with `EUR→USD` rate 1.1, `amount = 100` → increment `110`
- [ ] 5.4 Add unit test: no VipExchangeRate for proof currency → `ValidationDomainException` thrown, proof not confirmed
- [x] 5.5 Update `vip-payment-proof-review-and-view.usecase.spec.ts` if it stubs `confirmPending` — update stub signature
- [ ] 5.6 Update `create-payment-request.usecase.ts` unit test: stub `sumActiveAmountsUsd` (renamed from `sumActiveAmounts`)
- [ ] 5.7 Add unit test for `completeAndDecrementBalance`: CUP request at rate 200, amount 2000 → decrement 10 USD
- [ ] 5.8 Add unit test for `completeAndDecrementBalance`: renegotiated request uses `newAmount / exchangeRate`
- [ ] 5.9 Add unit test: `confirmPayment` (remittance) does NOT call `user.update` with `totalGeneratedAmount`

## 6. Smoke / integration validation

- [ ] 6.1 Update `smoke-remittance-payment-proof-one-call-nodb.ts` if it asserts a `totalGeneratedAmount` increment after `confirmPayment` — remove or adjust that assertion
- [x] 6.2 Run `npm run build` and confirm TypeScript compilation passes with zero errors
- [ ] 6.3 Run full unit test suite (`npm test`) — all tests green
- [ ] 6.4 Run smoke test against a running local server: confirm VIP proof in non-USD currency increments `totalGeneratedAmount` in USD
- [ ] 6.5 Manually verify: create PaymentRequest for non-USD amount → balance check uses USD-normalised `sumActiveAmountsUsd` → request succeeds or fails correctly
- [ ] 6.6 Manually verify: complete a PaymentRequest → `totalGeneratedAmount` decremented by USD equivalent

## 7. Historical data warning

- [ ] 7.1 Add a startup log warning in `VipPaymentProofsModule` or `AppModule` (at `onApplicationBootstrap`) noting that `User.totalGeneratedAmount` values created before this release may contain mixed-currency data and require Phase 2 recalculation
- [ ] 7.2 Document Phase 2 recalculation script requirements in a new `openspec/changes/normalize-vip-balance-usd/notes/phase2-recalculation.md` (not a new change — just a reference doc for the follow-up)

## 8. Rollback preparation (optional)

- [ ] 8.1 If team decides on feature-flag rollback: add `FEATURE_NORMALIZE_VIP_BALANCE_USD` env var check in `resolveAmountUsd` helper and `sumActiveAmountsUsd` — when `false`, fall back to raw amount (legacy behavior)
- [ ] 8.2 Document rollback procedure in `design.md` under Migration Plan (already present — verify steps are current)
