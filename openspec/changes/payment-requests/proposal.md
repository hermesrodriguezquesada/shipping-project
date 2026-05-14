# Proposal: Payment Requests — VIP Cash-Out Module

## Status

OPEN - PENDING IMPLEMENTATION

## Scope of this change

Define and implement a new `payment-requests` module that allows VIP clients to request
withdrawal/collection of part of their accumulated balance (`User.totalGeneratedAmount`).

This change covers:

- New `PaymentRequest` Prisma model with full lifecycle state machine
- Client-facing GraphQL mutations and queries
- Admin-facing GraphQL mutations and queries
- 6 new `InternalNotificationType` values
- 6 new `UserActionLogAction` values
- 2 new `SystemSetting` keys (pickup address and delivery-fee override)
- New `PaymentRequestStatus` and `PaymentRequestMethod` Prisma enums
- Transactional, idempotent admin payment completion that decrements `User.totalGeneratedAmount`
- **Available-balance guard**: creation validates against `availableBalance`, not raw `totalGeneratedAmount`, to prevent over-requesting across concurrent active requests

Out of scope:

- Frontend/UI implementation
- Email notifications (only internal in-app notifications)
- Integration with external payment providers
- Multi-currency `totalGeneratedAmount` tracking (currency assumed per existing contract)

---

## Context and Discovery Summary

### `User.totalGeneratedAmount`

- Type: `Decimal`, default `0`
- Currently only **incremented**, never decremented
- Incremented in two places inside DB transactions:
  1. `PrismaRemittanceCommandAdapter` when admin confirms remittance payment
  2. `PrismaVipPaymentProofCommandAdapter` when admin confirms a VIP payment proof
- No guard prevents over-decrement today; this module introduces the first decrement operation
- **Critical**: checking `amount ≤ totalGeneratedAmount` alone is insufficient. A VIP with
  balance 1000 could create two simultaneous requests of 1000 each, both passing that naive
  check. The real constraint must use `availableBalance`:
  ```
  availableBalance = totalGeneratedAmount − SUM(amount of active PaymentRequests)
  ```
  Active statuses: `REQUESTED`, `RENEGOTIATING`, `ACCEPTED`.
  Inactive statuses (excluded from sum): `PAID`, `CANCELED_BY_ADMIN`, `CANCELED_BY_CLIENT`.

### `VipExchangeRate`

- Model: `VipExchangeRate { fromCurrencyId, toCurrencyId, rate, enabled }`
- Unique constraint: one rate per currency pair
- Currently used only in `VipProfitPreviewUseCase` (informational)
- **Decision required**: whether to use this rate for `amountToPay` calculation or simply store the snapshot at request time

### `ExchangeRate`

- Multiple historical rows per pair; no unique constraint
- Used in remittance pricing via `PricingCalculatorService`

### `SystemSettings`

- No existing keys for pickup address or delivery fee
- Two new keys must be added: `CASH_PICKUP_ADDRESS` (STRING) and `CASH_DELIVERY_FEE_USD` (NUMBER)
- `DeliveryFeeRule` and `CommissionRule` models exist but are scoped to remittances; not reused here

### Existing `InternalNotificationType` enum (16 values)

6 new types needed — none overlap with existing values.

### Guards and roles

- No `VipGuard` exists; VIP check enforced at use-case level (throw if `!user.isVip`)
- `ActiveUserGuard` is applied at the resolver method level for user-facing mutations
- Admin operations use `RolesGuard` + `@Roles(Role.ADMIN)`

### Hexagonal pattern

- `modules/<name>/application/use-cases/` — one file per use-case
- `modules/<name>/domain/ports/` — pure TS interfaces (command + query split)
- `modules/<name>/infrastructure/adapters/` — `@Injectable()` Prisma adapters
- `modules/<name>/presentation/graphql/` — resolver, inputs/, types/, mappers/
- Port tokens in `src/shared/constants/tokens`
- `InternalNotificationCommandPort` injected inside use-cases (not resolvers)
- `RecordUserActionLogUseCase` / `recordUserActionLogSafe` called from resolvers (not use-cases)

---

## Problem to solve

VIP clients accumulate a `totalGeneratedAmount` balance through remittances and VIP payment
proofs, but currently have **no mechanism to collect or request withdrawal** of that balance.
This creates a friction point: VIP clients must contact admins informally to trigger payments,
with no audit trail, no lifecycle, and no system-enforced constraints.

---

## Proposed outcome

A self-service `payment-requests` module that:

1. Lets VIP clients create a structured withdrawal request specifying amount, payment method,
   and relevant delivery/transfer details.
2. Enforces business rules: `amount ≤ availableBalance` (not raw `totalGeneratedAmount`),
   delivery-fee threshold, method constraints, etc.
3. Provides admins with a lifecycle workflow: accept, renegotiate, complete, or cancel.
4. Atomically and idempotently decrements `totalGeneratedAmount` on final payment.
5. Sends in-app notifications to relevant parties at each lifecycle transition.
6. Produces a full audit trail via `UserActionLog`.

---

## Open questions to resolve before implementation

| # | Question | Impact |
|---|----------|--------|
| Q1 | Does `amount` represent the amount **withdrawn from the balance** (pre-fee) or the amount **the client receives** (post-fee)? | Determines whether `deliveryFee` is additive to `amount` or deducted from it in `amountToPay` |
| Q2 | Is `totalGeneratedAmount` denominated in a single global currency (USD) or can it be multi-currency? | Determines whether cross-currency comparison is needed for the balance check |
| Q3 | Which rate is used for `amountToPay` calculation: `ExchangeRate` or `VipExchangeRate`? | Determines which port to inject in the use-case; VipExchangeRate is more appropriate for VIP clients |
| Q4 | Is the delivery charge (10 USD) **deducted from the payout** (client receives less) or **added on top** (balance decremented by more than amount)? | Determines `amountToPay` formula and `totalGeneratedAmount` decrement value |
| Q5 | Where is the CASH pickup address configured? Answer: new `SystemSetting` key `CASH_PICKUP_ADDRESS` | Low risk — confirmed approach |
| Q6 | Should there be a public or client-facing query to retrieve the pickup address? | Scope: adds one extra use-case if yes |

**Recommended defaults** (to proceed if no stakeholder input):

- Q1: `amount` = amount withdrawn from balance (gross). `amountToPay` = amount client receives.
  → `amountToPay = amount - deliveryFee` when delivery applies.
  → `deliveryFee = 0` when no delivery.
  → `totalGeneratedAmount` decremented by `amount` (gross).
- Q2: `totalGeneratedAmount` is in USD (same currency as all existing remittance amounts).
  → Delivery fee threshold (> 1000 USD) compared directly without conversion.
- Q3: Use `VipExchangeRate` for `currencyId → USD` conversion at time of request creation.
  → Snapshot stored in `exchangeRate` field.
- Q4: Delivery fee is deducted from payout. Client bears the cost.
  → `amountToPay = amount - deliveryFee`.
  → `totalGeneratedAmount` decremented by `amount`.
- Q6: Yes — expose `systemCashPickupAddress: String` as an authenticated VIP-only query.

---

## Risks and dependencies

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Over-requesting / double-spend**: client creates multiple active requests whose total exceeds their balance | HIGH | At creation, compute `availableBalance = totalGeneratedAmount − SUM(active request amounts)` and enforce `newAmount ≤ availableBalance`. Active statuses: `REQUESTED`, `RENEGOTIATING`, `ACCEPTED`. |
| First `totalGeneratedAmount` decrement: no existing guard against negative balance | HIGH | Re-verify balance inside `completeAndDecrementBalance` transaction; use `updateMany WHERE status=ACCEPTED` to get atomic row count; skip decrement if count = 0 |
| Idempotency of `adminCompletePaymentRequest`: race condition if called twice | HIGH | `updateMany WHERE id=X AND status=ACCEPTED`; if `count === 0` the row was already `PAID` — skip decrement and return existing record |
| `VipExchangeRate` missing for requested currency pair | MEDIUM | Throw `DomainException` with clear message; do not silently fall back to `ExchangeRate` |
| `CASH_DELIVERY_FEE_USD` / `CASH_PICKUP_ADDRESS` not seeded | MEDIUM | Add to `prisma/seed.ts` with sensible defaults; throw at runtime if missing |
| `InternalNotificationType` enum extension requires Prisma migration | LOW | Standard migration; no existing code depends on the new values |
| No `VipGuard` — VIP check in every use-case must be consistent | LOW | Extract to shared domain helper or document as a pattern requirement in tasks |

---

## Validation required by this change

- `npm run build` — zero errors
- `PORT=3001 npm run start:dev` — server starts, schema.gql updated
- VIP client can create a request, view it, and cancel it
- Admin can list, renegotiate, accept, complete, and cancel requests
- `totalGeneratedAmount` decrements exactly once on `adminCompletePaymentRequest`
- All 6 notification types fan out to correct recipients
- `UserActionLog` entries created for all state-changing operations
