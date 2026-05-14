## Why

`User.totalGeneratedAmount` accumulates values from three sources (VIP payment proof confirmations, remittance payment confirmations, and payment request completions) without a defined currency unit, mixing USD, EUR, CUP, and MLC amounts in a single `Decimal` field. This makes the VIP balance check in `createPaymentRequest` mathematically incoherent whenever any proof or remittance is denominated in a non-USD currency. Frontend has confirmed the VIP accumulated balance must always be expressed in USD.

## What Changes

- **VIP proof confirmation** (`adminConfirmVipPaymentProof`): the amount added to `totalGeneratedAmount` will be converted to USD using the `VipExchangeRate` snapshot before incrementing. If the proof is already in USD the conversion is a no-op. If no VipExchangeRate exists for the pair, confirmation is rejected.
- **`sumActiveAmounts` query**: will return the sum of active `PaymentRequest` amounts converted to USD via their stored `exchangeRate` snapshot, replacing the current raw cross-currency sum.
- **Payment request completion** (`adminCompletePaymentRequest`): the amount decremented from `totalGeneratedAmount` will be `effectiveAmount / exchangeRate` (USD-normalised), not the raw currency amount.
- **Remittances decouple from VIP balance** **BREAKING**: `Remittance.confirmPayment` will no longer increment `User.totalGeneratedAmount`. Remittances are a separate financial flow from VIP deposits.
- **Historical data risk warning**: existing `totalGeneratedAmount` values in the database are of unknown currency composition. A Phase 2 recalculation script will be provided but is out of scope for this change.

## Capabilities

### New Capabilities

- `vip-balance-usd-normalization`: USD-normalised `totalGeneratedAmount` semantics for VIP deposits, active-amounts query, and payment request completion. Includes the conversion helper and updated proof confirmation guard.

### Modified Capabilities

- `vip-payment-proofs`: confirmation flow adds USD conversion step before writing `totalGeneratedAmount`.
- `payment-requests`: `sumActiveAmounts` and `completeAndDecrementBalance` are updated to operate in USD.
- `remittances`: `confirmPayment` no longer writes `totalGeneratedAmount`.

## Impact

- **`prisma-vip-payment-proof-command.adapter.ts`**: `confirmPending` must resolve `VipExchangeRate` and convert before `increment`.
- **`prisma-payment-request-query.adapter.ts`**: `sumActiveAmounts` signature changes to return USD-normalised aggregate (requires individual `exchangeRate` snapshots per row, not a bare SQL `SUM`).
- **`prisma-payment-request-command.adapter.ts`**: `completeAndDecrementBalance` uses `effectiveAmount / exchangeRate` for the decrement.
- **`prisma-remittance-command.adapter.ts`**: remove `totalGeneratedAmount` increment block from `confirmPayment`.
- **`create-payment-request.usecase.ts`**: `availableBalance` comparison continues to use USD, becomes correct.
- **`VipPaymentProofCommandPort`**: `confirmPending` input gains `vipExchangeRatePort` dependency at use-case level (injected via DI).
- **GraphQL contract**: `UserType.totalGeneratedAmount` field semantics change to "USD balance" — no rename required, but clients must be informed the unit is now always USD.
- No Prisma schema migration is required; `totalGeneratedAmount` remains `Decimal` on `User`.
- **Breaking for data integrity**: any existing row in `User` with `totalGeneratedAmount` reflecting mixed currencies will be incorrect until Phase 2 recalculation is executed.
