## 1. VIP Payment Proof — USD conversion on confirm

- [x] 1.1 Add `ExchangeRateQueryPort` injection to `AdminConfirmVipPaymentProofUseCase` constructor (replaces `VipExchangeRateQueryPort`)
- [x] 1.2 Implement `resolveAmountUsd(amount, currencyCode, exchangeRateQuery)` helper in the use case: USD no-op, `USD→currency` divide, `currency→USD` multiply, else throw `ValidationDomainException('Exchange rate to USD not configured')`
- [x] 1.3 Call `resolveAmountUsd` in `AdminConfirmVipPaymentProofUseCase.execute` before calling `command.confirmPending`, passing the resolved `amountUsd`
- [x] 1.4 Update `VipPaymentProofCommandPort.confirmPending` signature to accept `amountUsd: Prisma.Decimal` instead of deriving it from the stored proof amount
- [x] 1.5 Update `PrismaVipPaymentProofCommandAdapter.confirmPending` to use the passed `amountUsd` for the `totalGeneratedAmount { increment }` call
- [x] 1.6 Export `ExchangeRateQueryPort` from `VipPricingModule` so `VipPaymentProofsModule` and `PaymentRequestsModule` can inject it via the class-based DI token

## 2. Payment Requests — sumActiveAmountsUsd

- [x] 2.1 Rename `sumActiveAmounts` to `sumActiveAmountsUsd` in `PaymentRequestQueryPort` interface
- [x] 2.2 Rename the method in `PrismaPaymentRequestQueryAdapter`: change implementation from `aggregate._sum.amount` to fetch all active rows with `select: { amount, exchangeRate }`, reduce with `Σ(amount / exchangeRate)`, return `Prisma.Decimal`
- [x] 2.3 Update `CreatePaymentRequestUseCase` to call `query.sumActiveAmountsUsd` (rename only — logic already uses the result correctly as USD)

## 3. Payment Requests — exchange rate lookup on create

- [x] 3.0 Replace `VipExchangeRateQueryPort` with `ExchangeRateQueryPort` in `CreatePaymentRequestUseCase`: look up `ExchangeRate(from=USD, to=currency)` for the `exchangeRate` snapshot; throw `ValidationDomainException('Exchange rate to USD not configured')` when absent

## 4. Payment Requests — USD decrement on complete

- [x] 4.1 In `PrismaPaymentRequestCommandAdapter.completeAndDecrementBalance`, after re-fetching `request`, add `const effectiveAmountUsd = effectiveAmount.div(request.exchangeRate)`
- [x] 4.2 Replace `totalGeneratedAmount: { decrement: effectiveAmount }` with `totalGeneratedAmount: { decrement: effectiveAmountUsd }`
- [x] 4.3 Update the balance guard: `user.totalGeneratedAmount.lt(effectiveAmountUsd)` (was `effectiveAmount`)
- [x] 4.4 Re-fetch `exchangeRate` along with `newAmount` and `amount` in the `findUnique` call inside the transaction (add `exchangeRate` to `select`)

## 5. Remittances — decouple from VIP balance

- [x] 5.1 Remove the `await tx.user.update({ totalGeneratedAmount: { increment } })` block from `PrismaRemittanceCommandAdapter.confirmPayment` (including the `tx.remittance.findUnique` used only to get `senderUserId` and `amount` for that increment)
- [x] 5.2 Simplify `confirmPayment` to a single `$transaction` that only updates `Remittance.status → PAID_SENDING_TO_RECEIVER` using `updateMany` — if no longer needing the inner `findUnique`, the `$transaction` wrapper can be removed (idempotency is still via `updateMany` count check)
- [x] 5.3 Update the JSDoc comment in `ExternalPaymentAcceptanceUseCase` to remove the `- totalGeneratedAmount increment` bullet

## 6. Unit tests

- [ ] 6.1 Add unit test to `admin-confirm-vip-payment-proof.usecase.spec.ts`: USD proof increments `amountUsd = amount`
- [ ] 6.2 Add unit test: CUP proof with `ExchangeRate USD→CUP` rate 200, `amount = 20000` → increment `100`
- [ ] 6.3 Add unit test: EUR proof with `ExchangeRate EUR→USD` rate 1.1, `amount = 100` → increment `110`
- [ ] 6.4 Add unit test: no ExchangeRate for proof currency → `ValidationDomainException` thrown, proof not confirmed
- [x] 6.5 Update `vip-payment-proof-review-and-view.usecase.spec.ts` if it stubs `confirmPending` — update stub signature
- [ ] 6.6 Update `create-payment-request.usecase.ts` unit test: stub `sumActiveAmountsUsd` (renamed from `sumActiveAmounts`) and stub `ExchangeRateQueryPort` instead of `VipExchangeRateQueryPort`
- [ ] 6.7 Add unit test for `completeAndDecrementBalance`: CUP request at rate 200, amount 2000 → decrement 10 USD
- [ ] 6.8 Add unit test for `completeAndDecrementBalance`: renegotiated request uses `newAmount / exchangeRate`
- [ ] 6.9 Add unit test: `confirmPayment` (remittance) does NOT call `user.update` with `totalGeneratedAmount`

## 7. Smoke / integration validation

- [ ] 7.1 Update `smoke-remittance-payment-proof-one-call-nodb.ts` if it asserts a `totalGeneratedAmount` increment after `confirmPayment` — remove or adjust that assertion
- [x] 7.2 Run `npm run build` and confirm TypeScript compilation passes with zero errors
- [ ] 7.3 Run full unit test suite (`npm test`) — all tests green
- [ ] 7.4 Run smoke test: VIP proof in USDT (ExchangeRate USD→USDT = 1) → confirm → `totalGeneratedAmount` += 100 USD
- [ ] 7.5 Run smoke test: VIP proof in CUP (ExchangeRate USD→CUP = 390), amount=39000 → confirm → `totalGeneratedAmount` += 100 USD
- [ ] 7.6 Run smoke test: PaymentRequest in USDT (ExchangeRate USD→USDT = 1), amount=300 → reserves 300 USD → complete → decrements 300 USD
- [ ] 7.7 Verify: deleting/disabling VipExchangeRate does NOT affect PaymentRequest or VipPaymentProof balance flow

## 8. Historical data warning

- [ ] 8.1 Add a startup log warning in `VipPaymentProofsModule` or `AppModule` (at `onApplicationBootstrap`) noting that `User.totalGeneratedAmount` values created before this release may contain mixed-currency data and require Phase 2 recalculation
- [ ] 8.2 Document Phase 2 recalculation script requirements in a new `openspec/changes/normalize-vip-balance-usd/notes/phase2-recalculation.md` (not a new change — just a reference doc for the follow-up)

## 9. Rollback preparation (optional)

- [ ] 9.1 If team decides on feature-flag rollback: add `FEATURE_NORMALIZE_VIP_BALANCE_USD` env var check in `resolveAmountUsd` helper and `sumActiveAmountsUsd` — when `false`, fall back to raw amount (legacy behavior)
- [ ] 9.2 Document rollback procedure in `design.md` under Migration Plan (already present — verify steps are current)
