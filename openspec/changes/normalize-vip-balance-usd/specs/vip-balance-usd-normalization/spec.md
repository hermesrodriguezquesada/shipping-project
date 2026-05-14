## ADDED Requirements

### Requirement: VIP proof confirmation converts amount to USD before crediting balance

When an admin confirms a `VipPaymentProof`, the system SHALL resolve the USD equivalent of `proof.amount` using the current enabled general `ExchangeRate` and increment `User.totalGeneratedAmount` by that USD amount, not by the raw `proof.amount`.

Conversion rules:
- If `proof.currency.code == "USD"`: `amountUsd = proof.amount`
- Else if an `ExchangeRate(from=USD, to=proof.currency, enabled=true)` exists: `amountUsd = proof.amount / rate`
- Else if an `ExchangeRate(from=proof.currency, to=USD, enabled=true)` exists: `amountUsd = proof.amount * rate`
- Else: the confirmation MUST be rejected with a `ValidationDomainException`

The conversion and the `totalGeneratedAmount` increment MUST occur atomically within the same `$transaction` that updates `VipPaymentProof.status → CONFIRMED`.

#### Scenario: Proof in USD — no conversion needed
- **WHEN** an admin confirms a `VipPaymentProof` with `currency.code = "USD"` and `amount = 500`
- **THEN** `User.totalGeneratedAmount` is incremented by exactly `500`

#### Scenario: Proof in CUP with ExchangeRate USD→CUP at 200
- **WHEN** an admin confirms a `VipPaymentProof` with `currency.code = "CUP"`, `amount = 20000`, and the only enabled `ExchangeRate` for CUP is `USD → CUP` with `rate = 200`
- **THEN** `User.totalGeneratedAmount` is incremented by exactly `100` (= 20000 / 200)

#### Scenario: Proof in EUR with ExchangeRate EUR→USD at 1.1
- **WHEN** an admin confirms a `VipPaymentProof` with `currency.code = "EUR"`, `amount = 100`, and an enabled `ExchangeRate` `EUR → USD` with `rate = 1.1` exists
- **THEN** `User.totalGeneratedAmount` is incremented by exactly `110` (= 100 * 1.1)

#### Scenario: No ExchangeRate configured for proof currency
- **WHEN** an admin attempts to confirm a `VipPaymentProof` with `currency.code = "MLC"` and no enabled `ExchangeRate` exists for any pair involving MLC
- **THEN** the confirmation is rejected with a `ValidationDomainException` containing a message indicating the exchange rate to USD is not configured
- **AND** `VipPaymentProof.status` remains `PENDING_CONFIRMATION`
- **AND** `User.totalGeneratedAmount` is not modified

#### Scenario: Atomicity — rate lookup failure rolls back status change
- **WHEN** the `VipExchangeRate` lookup succeeds but the `User` update fails within the transaction
- **THEN** the `VipPaymentProof` status update is also rolled back
- **AND** `User.totalGeneratedAmount` is not modified

---

### Requirement: Active payment requests contribute to balance as USD

`sumActiveAmountsUsd(ownerUserId)` SHALL return the sum of all active `PaymentRequest` amounts converted to USD using each request's stored `exchangeRate` snapshot.

Active statuses: `REQUESTED`, `RENEGOTIATING`, `ACCEPTED`.

The conversion per request: `amountUsd_i = request.amount / request.exchangeRate`

If `request.exchangeRate == 1` (USD request): `amountUsd_i = request.amount`

The sum MUST be computed in the application layer (TypeScript), not via a raw SQL aggregate.

#### Scenario: All active requests are in USD
- **WHEN** a user has two active `PaymentRequest` records both with `exchangeRate = 1` and `amount = 100` and `200` respectively
- **THEN** `sumActiveAmountsUsd` returns `300`

#### Scenario: Active requests in different currencies
- **WHEN** a user has one active `PaymentRequest` with `amount = 2000`, `exchangeRate = 200` (CUP), and another with `amount = 50`, `exchangeRate = 1` (USD)
- **THEN** `sumActiveAmountsUsd` returns `60` (= 2000/200 + 50/1)

#### Scenario: No active requests
- **WHEN** a user has no `PaymentRequest` records in `REQUESTED | RENEGOTIATING | ACCEPTED` status
- **THEN** `sumActiveAmountsUsd` returns `0`

---

### Requirement: Payment request creation validates balance in USD

`createPaymentRequest` SHALL compute the available VIP balance as:

```
availableBalanceUsd = User.totalGeneratedAmount - sumActiveAmountsUsd(ownerUserId)
```

And validate that `amountUsd = amount / exchangeRate ≤ availableBalanceUsd`.

Both `totalGeneratedAmount` and `sumActiveAmountsUsd` are guaranteed USD after this change.

#### Scenario: Sufficient USD balance
- **WHEN** a VIP user with `totalGeneratedAmount = 500` has no active requests and submits a `createPaymentRequest` with `amount = 2000` in a currency where `ExchangeRate USD → currency = 200` (amountUsd = 10)
- **THEN** the request is created successfully

#### Scenario: Insufficient USD balance
- **WHEN** a VIP user with `totalGeneratedAmount = 5` submits a `createPaymentRequest` that converts to `amountUsd = 10`
- **THEN** the request is rejected with `ValidationDomainException('Insufficient available VIP balance')`

#### Scenario: Balance correctly reduced by existing active requests
- **WHEN** a VIP user with `totalGeneratedAmount = 100` has an existing active request for `amountUsd = 80` (after conversion)
- **AND** submits a new request for `amountUsd = 30`
- **THEN** the request is rejected (availableBalance = 20 < 30)

---

### Requirement: Payment request completion decrements balance in USD

`completeAndDecrementBalance` SHALL decrement `User.totalGeneratedAmount` by `effectiveAmountUsd = effectiveAmount / request.exchangeRate`, where `effectiveAmount = request.newAmount ?? request.amount`.

The decrement MUST occur atomically within the same `$transaction` that transitions `PaymentRequest.status → PAID`.

#### Scenario: Complete a USD request
- **WHEN** an admin completes a `PaymentRequest` with `amount = 100`, `exchangeRate = 1` (USD), and no `newAmount`
- **THEN** `User.totalGeneratedAmount` is decremented by exactly `100`

#### Scenario: Complete a CUP request at exchange rate 200
- **WHEN** an admin completes a `PaymentRequest` with `amount = 2000`, `exchangeRate = 200`, and no `newAmount`
- **THEN** `User.totalGeneratedAmount` is decremented by exactly `10` (= 2000 / 200)

#### Scenario: Complete a renegotiated request uses newAmount
- **WHEN** an admin completes a `PaymentRequest` with `amount = 2000`, `newAmount = 1000`, `exchangeRate = 200`
- **THEN** `User.totalGeneratedAmount` is decremented by exactly `5` (= 1000 / 200)

#### Scenario: Insufficient balance at payment time rejects completion
- **WHEN** `User.totalGeneratedAmount = 4` and the effective USD amount is `5`
- **THEN** the completion is rejected with `ValidationDomainException('Insufficient balance at payment time')`
- **AND** `PaymentRequest.status` remains `ACCEPTED`

#### Scenario: Idempotent completion
- **WHEN** `adminCompletePaymentRequest` is called for a `PaymentRequest` already in `PAID` status
- **THEN** the operation returns without side effects and does not modify `totalGeneratedAmount` a second time

---

### Requirement: Remittance confirmation does not modify VIP balance

`Remittance.confirmPayment` (and `ExternalPaymentAcceptanceUseCase`) SHALL NOT write to `User.totalGeneratedAmount`.

Remittance payment confirmation is limited to updating `Remittance.status → PAID_SENDING_TO_RECEIVER` and its associated notifications.

#### Scenario: Admin confirms remittance payment
- **WHEN** an admin confirms a remittance payment
- **THEN** `Remittance.status` transitions to `PAID_SENDING_TO_RECEIVER`
- **AND** `User.totalGeneratedAmount` is NOT modified

#### Scenario: External payment accepted for a remittance
- **WHEN** an external payment webhook triggers `ExternalPaymentAcceptanceUseCase`
- **THEN** the remittance status is updated
- **AND** `User.totalGeneratedAmount` is NOT modified

---

## MODIFIED Requirements

### Requirement: sumActiveAmounts port signature uses USD-normalised result

The `PaymentRequestQueryPort` interface previously exposed:

```typescript
sumActiveAmounts(ownerUserId: string): Promise<Prisma.Decimal>;
```

This method SHALL be renamed to `sumActiveAmountsUsd` to make the USD contract explicit.

```typescript
sumActiveAmountsUsd(ownerUserId: string): Promise<Prisma.Decimal>;
```

All callers (`CreatePaymentRequestUseCase`) MUST be updated to call `sumActiveAmountsUsd`.

#### Scenario: Port rename is consistent across interface, adapter, and call site
- **WHEN** the codebase compiles after this change
- **THEN** there are no references to `sumActiveAmounts` remaining (TypeScript build passes)
