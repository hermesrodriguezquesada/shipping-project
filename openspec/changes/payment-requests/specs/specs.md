# Specs: Payment Requests — VIP Cash-Out Module

## Status

OPEN - PENDING IMPLEMENTATION

---

## S-001 — Prisma schema: new enums

**Precondition**: `schema.prisma` does not contain `PaymentRequestStatus`,
`PaymentRequestMethod`.

**Changes**:

Add to `schema.prisma`:

```prisma
enum PaymentRequestStatus {
  REQUESTED
  RENEGOTIATING
  ACCEPTED
  PAID
  CANCELED_BY_ADMIN
  CANCELED_BY_CLIENT
}

enum PaymentRequestMethod {
  TRANSFER
  CASH
}
```

**Acceptance criteria**:
- `prisma generate` succeeds with zero errors.
- `PaymentRequestStatus` and `PaymentRequestMethod` are available in the generated Prisma client.

---

## S-002 — Prisma schema: `PaymentRequest` model

**Precondition**: S-001 complete.

**Changes**:

Add `PaymentRequest` model as defined in design.md §1.

Add relations from `User` back-side:
```prisma
paymentRequests         PaymentRequest[] @relation("PaymentRequestOwner")
reviewedPaymentRequests PaymentRequest[] @relation("PaymentRequestReviewer")
paidPaymentRequests     PaymentRequest[] @relation("PaymentRequestPaidBy")
```

**Acceptance criteria**:
- `prisma generate` succeeds.
- `prisma migrate dev` produces a single clean migration.
- All indexes present: `[ownerUserId, createdAt]`, `[status, createdAt]`, `[ownerUserId, status]`.

---

## S-003 — Prisma schema: new enum values on existing enums

**Changes**:

Append to `InternalNotificationType`:
```
NEW_PAYMENT_REQUEST
PAYMENT_REQUEST_RENEGOTIATED
PAYMENT_REQUEST_ACCEPTED
PAYMENT_REQUEST_PAID
PAYMENT_REQUEST_CANCELED_BY_ADMIN
PAYMENT_REQUEST_CANCELED_BY_CLIENT
```

Append to `UserActionLogAction`:
```
CREATE_PAYMENT_REQUEST
CLIENT_ACCEPT_PAYMENT_REQUEST
CLIENT_CANCEL_PAYMENT_REQUEST
ADMIN_RENEGOTIATE_PAYMENT_REQUEST
ADMIN_ACCEPT_PAYMENT_REQUEST
ADMIN_COMPLETE_PAYMENT_REQUEST
ADMIN_CANCEL_PAYMENT_REQUEST
```

**Acceptance criteria**:
- `prisma generate` succeeds.
- New values available in Prisma client.
- No existing code references break.

---

## S-004 — SystemSettings seeds

**Changes**:

In `prisma/seed.ts`, add three new `upsert` entries:

| Key | Type | Value |
|-----|------|-------|
| `CASH_PICKUP_ADDRESS` | `STRING` | `"TBD - Contact admin for address"` |
| `CASH_DELIVERY_FEE_USD` | `NUMBER` | `"10"` |
| `CASH_DELIVERY_MIN_AMOUNT_USD` | `NUMBER` | `"1000"` |

**Acceptance criteria**:
- `npx prisma db seed` runs without error.
- Three settings are present in `SystemSetting` table.

---

## S-005 — Domain ports

**Files to create**:

### `payment-request-command.port.ts`

```ts
export interface PaymentRequestCommandPort {
  create(input: CreatePaymentRequestCommandInput): Promise<PaymentRequestEntity>;
  updateStatus(input: UpdatePaymentRequestStatusInput): Promise<PaymentRequestEntity>;
  renegotiate(input: RenegotiatePaymentRequestInput): Promise<PaymentRequestEntity>;
  completeAndDecrementBalance(input: CompletePaymentRequestInput): Promise<PaymentRequestEntity>;
}
```

Where `CompletePaymentRequestInput` includes `{ id, paidById }` and the adapter implements
the transactional idempotency pattern (see S-010).

### `payment-request-query.port.ts`

```ts
export interface PaymentRequestQueryPort {
  findById(id: string): Promise<PaymentRequestEntity | null>;
  findByIdOrThrow(id: string): Promise<PaymentRequestEntity>;
  findMany(filters: PaymentRequestFilters, pagination: PaginationInput): Promise<PaymentRequestEntity[]>;
  sumActiveAmounts(ownerUserId: string): Promise<Decimal>;
}
```

`sumActiveAmounts` returns the sum of `amount` for all `PaymentRequest` records owned by
`ownerUserId` whose status is `REQUESTED`, `RENEGOTIATING`, or `ACCEPTED`.
Returns `Decimal(0)` if no active requests exist.

**Acceptance criteria**:
- Both interfaces compile with zero errors.
- No Prisma imports in domain layer.

---

## S-006 — Port tokens

**File**: `src/shared/constants/tokens.ts`

Add:
```ts
export const PAYMENT_REQUEST_COMMAND_PORT = 'PAYMENT_REQUEST_COMMAND_PORT';
export const PAYMENT_REQUEST_QUERY_PORT   = 'PAYMENT_REQUEST_QUERY_PORT';
```

**Acceptance criteria**:
- File compiles; tokens are string constants.

---

## S-007 — Use-case: `CreatePaymentRequestUseCase`

**Inputs**: `{ senderUserId, amount (Decimal string), currencyId, method, account?, address?, delivery }`

**Logic**:

1. Fetch `user` via `UserQueryPort`. Assert `user.isVip === true` (throw `ForbiddenDomainException`).
2. Fetch `currency` via `CurrencyCatalogQueryPort`. Assert enabled.
3. Fetch `vipExchangeRate` via `VipExchangeRateQueryPort.findByCurrencyPair({ fromCurrencyCode: currency.code, toCurrencyCode: 'USD', enabledOnly: true })`.
   - If currency is USD, use rate = 1.
   - If not found, throw `DomainException('No VIP exchange rate available for this currency pair')`.
4. Read `CASH_DELIVERY_FEE_USD` and `CASH_DELIVERY_MIN_AMOUNT_USD` from `SystemSettingQueryPort`.
5. Validate amount:
   - `amountDecimal > 0`.
   - Compute `amountInUSD = amountDecimal / rate`.
   - Compute **available balance**:
     ```
     activeSum        = PaymentRequestQueryPort.sumActiveAmounts(senderUserId)
     availableBalance = user.totalGeneratedAmount − activeSum
     ```
   - Assert `amountInUSD ≤ availableBalance`.
     Throw `ValidationDomainException('Insufficient available VIP balance')` if not.
6. Validate method constraints:
   - TRANSFER: `account` required, `delivery` must be false, `address` must be null.
   - CASH + delivery=true: `address` required, `amountInUSD > CASH_DELIVERY_MIN_AMOUNT_USD` required.
   - CASH + delivery=false: `address` must be null.
7. Compute `deliveryFee` (in currency): `delivery ? CASH_DELIVERY_FEE_USD / rate : 0`.
8. Compute `amountToPay = amount - deliveryFee`.
9. Persist via `PaymentRequestCommandPort.create(...)`.
10. Send `NEW_PAYMENT_REQUEST` notification to all admins (non-blocking).

**Acceptance criteria**:
- VIP=false user → `ForbiddenDomainException`.
- `amountInUSD > totalGeneratedAmount` (no active requests) → `ValidationDomainException('Insufficient available VIP balance')`.
- `amountInUSD ≤ totalGeneratedAmount` but `amountInUSD > availableBalance` (active requests consume the rest) → `ValidationDomainException('Insufficient available VIP balance')`.
- Two simultaneous requests that individually fit `totalGeneratedAmount` but together exceed it: second one fails.
- TRANSFER + delivery=true → `DomainException`.
- CASH + delivery=true + amount ≤ threshold → `DomainException`.
- CASH + delivery=true + no address → `DomainException`.
- Happy path returns persisted `PaymentRequestEntity` with correct computed fields.

---

## S-008 — Use-case: `MyPaymentRequestsUseCase`

**Inputs**: `{ userId, status?, dateFrom?, dateTo?, offset?, limit? }`

**Logic**:
1. Fetch user, assert `isVip === true`.
2. Delegate to `PaymentRequestQueryPort.findMany({ ownerUserId: userId, ...filters }, pagination)`.

**Acceptance criteria**:
- Returns only requests owned by `userId`.
- VIP=false → empty list or `ForbiddenDomainException` (consistent with other VIP use-cases).

---

## S-009 — Use-case: `ClientAcceptPaymentRequestUseCase`

**Inputs**: `{ userId, paymentRequestId }`

**Logic**:
1. `findByIdOrThrow`. Assert `owner.id === userId`. Assert `status === RENEGOTIATING`.
2. Update status to `ACCEPTED` via `updateStatus`.
3. Send `PAYMENT_REQUEST_ACCEPTED` notification to all admins (non-blocking).

**Acceptance criteria**:
- Non-owner → `ForbiddenDomainException`.
- Wrong status → `DomainException('Cannot accept: not in RENEGOTIATING status')`.
- Happy path → status = `ACCEPTED`, notification sent.

---

## S-010 — Use-case: `ClientCancelPaymentRequestUseCase`

**Inputs**: `{ userId, paymentRequestId, reason? }`

**Logic**:
1. `findByIdOrThrow`. Assert `owner.id === userId`.
2. Assert `status in [REQUESTED, RENEGOTIATING]`.
3. Update status to `CANCELED_BY_CLIENT`, set `canceledReason`.
4. Send `PAYMENT_REQUEST_CANCELED_BY_CLIENT` notification to all admins (non-blocking).

**Acceptance criteria**:
- Non-owner → `ForbiddenDomainException`.
- Status = `ACCEPTED` → `DomainException`.
- Happy path → status = `CANCELED_BY_CLIENT`.

---

## S-011 — Use-case: `SystemCashPickupAddressUseCase`

**Logic**:
1. Read `CASH_PICKUP_ADDRESS` from `SystemSettingQueryPort`.
2. If not found or value is null, throw `DomainException('Pickup address not configured')`.
3. Return value as string.

**Acceptance criteria**:
- Returns the string value.
- Missing setting → `DomainException`.

---

## S-012 — Use-case: `AdminPaymentRequestsUseCase`

**Inputs**: `{ status?, ownerUserId?, method?, dateFrom?, dateTo?, offset?, limit? }`

**Logic**:
- Delegate to `PaymentRequestQueryPort.findMany(filters, pagination)`.
- No ownership filter (admin sees all).

**Acceptance criteria**:
- Returns paginated list with applied filters.

---

## S-013 — Use-case: `AdminRenegotiatePaymentRequestUseCase`

**Inputs**: `{ adminUserId, paymentRequestId, newAmount, reason? }`

**Logic**:
1. `findByIdOrThrow`. Assert `status in [REQUESTED]`.

   > Note: renegotiation from `RENEGOTIATING` (admin updates the offer) is currently out of
   > scope. Only one renegotiation round is supported in v1.

2. Assert `newAmountDecimal > 0 && newAmountDecimal ≤ request.amount`.
3. Update via `PaymentRequestCommandPort.renegotiate({ id, newAmount, reviewedById: adminUserId, reviewedAt: now, canceledReason: reason })`.
   - Status → `RENEGOTIATING`.
4. Send `PAYMENT_REQUEST_RENEGOTIATED` notification to owner (non-blocking).

**Acceptance criteria**:
- Status ≠ `REQUESTED` → `DomainException`.
- `newAmount > amount` → `DomainException`.
- Happy path → status = `RENEGOTIATING`, `newAmount` persisted.

---

## S-014 — Use-case: `AdminAcceptPaymentRequestUseCase`

**Inputs**: `{ adminUserId, paymentRequestId }`

**Logic**:
1. `findByIdOrThrow`. Assert `status in [REQUESTED]`.
2. Update status to `ACCEPTED`, set `reviewedById`, `reviewedAt`.
3. Send `PAYMENT_REQUEST_ACCEPTED` notification to owner (non-blocking).

**Acceptance criteria**:
- Status ≠ `REQUESTED` → `DomainException`.
- Happy path → status = `ACCEPTED`.

---

## S-015 — Use-case: `AdminCompletePaymentRequestUseCase` (idempotent)

**Inputs**: `{ adminUserId, paymentRequestId }`

**Logic**:
1. `findByIdOrThrow`.
2. If `status === PAID`: return existing entity (idempotent, no second decrement).
3. Assert `status === ACCEPTED`.
4. Call `PaymentRequestCommandPort.completeAndDecrementBalance({ id, paidById: adminUserId })`.
5. Send `PAYMENT_REQUEST_PAID` notification to owner (non-blocking).

**Adapter implementation** (`completeAndDecrementBalance`):
```ts
// Inside prisma.$transaction(async (tx) => {
//   1. updateMany({ where: { id, status: ACCEPTED }, data: { status: PAID, paidById, paidAt } })
//   2. If count === 0:
//      a. Re-fetch request. If status === PAID → return it (already done, idempotent).
//      b. Else throw DomainException('Cannot complete: unexpected status').
//   3. Re-fetch request to read newAmount / amount.
//   4. effectiveAmount = request.newAmount ?? request.amount
//   5. Re-fetch user.totalGeneratedAmount.
//   6. Assert user.totalGeneratedAmount >= effectiveAmount (prevent negative balance).
//   7. tx.user.update({ totalGeneratedAmount: { decrement: effectiveAmount } })
// })
```

**`effectiveAmount` rationale**: if admin renegotiated to a lower `newAmount` and client
accepted, only that accepted lower amount should be debited from `totalGeneratedAmount`.
Using `amount` after a renegotiation would over-charge the balance.

**Acceptance criteria**:
- Status = `ACCEPTED` → marks PAID, decrements `totalGeneratedAmount` by `effectiveAmount`.
- `effectiveAmount` = `newAmount` when renegotiation occurred; = `amount` otherwise.
- Called twice (second call after `PAID`): returns `PAID` record, `totalGeneratedAmount` unchanged.
- Status ≠ `ACCEPTED` and ≠ `PAID` → `DomainException`.
- `totalGeneratedAmount < effectiveAmount` at completion time → `DomainException('Insufficient balance at payment time')`.

---

## S-016 — Use-case: `AdminCancelPaymentRequestUseCase`

**Inputs**: `{ adminUserId, paymentRequestId, reason? }`

**Logic**:
1. `findByIdOrThrow`. Assert `status in [REQUESTED, RENEGOTIATING, ACCEPTED]`.
2. Update status to `CANCELED_BY_ADMIN`, set `canceledReason`, `reviewedById`, `reviewedAt`.
3. Send `PAYMENT_REQUEST_CANCELED_BY_ADMIN` notification to owner (non-blocking).

**Acceptance criteria**:
- Status = `PAID` → `DomainException`.
- Happy path → status = `CANCELED_BY_ADMIN`.

---

## S-017 — Prisma adapter: `PrismaPaymentRequestCommandAdapter`

Implements `PaymentRequestCommandPort`.

Key methods:
- `create`: `prisma.paymentRequest.create(...)`.
- `updateStatus`: `prisma.paymentRequest.update({ where: { id }, data: { status, canceledReason, reviewedById, reviewedAt } })`.
- `renegotiate`: `prisma.paymentRequest.update({ where: { id }, data: { status: RENEGOTIATING, newAmount, reviewedById, reviewedAt } })`.
- `completeAndDecrementBalance`: wrapped in `prisma.$transaction`, as specified in S-015.

**Acceptance criteria**:
- All methods compile without type errors.
- `completeAndDecrementBalance` uses `prisma.$transaction`.

---

## S-018 — Prisma adapter: `PrismaPaymentRequestQueryAdapter`

Implements `PaymentRequestQueryPort`.

Key method: `findMany` supports:
- `ownerUserId` filter
- `status` filter
- `method` filter
- `dateFrom` / `dateTo` filter on `createdAt`
- `offset` and `limit` pagination

Always includes `owner`, `currency`, `reviewedBy`, `paidBy` via `include` or `select`.

`sumActiveAmounts` implementation:
```ts
// prisma.paymentRequest.aggregate({
//   where: {
//     ownerUserId,
//     status: { in: ['REQUESTED', 'RENEGOTIATING', 'ACCEPTED'] },
//   },
//   _sum: { amount: true },
// })
// return result._sum.amount ?? new Decimal(0)
```

**Acceptance criteria**:
- Filters compose correctly.
- Returns typed `PaymentRequestEntity[]`.
- `sumActiveAmounts` returns `Decimal(0)` when no active requests exist.
- `sumActiveAmounts` excludes `PAID`, `CANCELED_BY_ADMIN`, `CANCELED_BY_CLIENT` statuses.

---

## S-019 — GraphQL types and inputs

**Files**:

- `payment-request.type.ts`: `@ObjectType() PaymentRequestType` with all fields from design §4.
  Decimal fields serialized as `String` via `@Field(() => String)`.
- `create-payment-request.input.ts`: `CreatePaymentRequestInput`.
- `my-payment-requests.input.ts`: `MyPaymentRequestsInput`.
- `admin-payment-requests.input.ts`: `AdminPaymentRequestsInput`.
- `admin-renegotiate-payment-request.input.ts`: `AdminRenegotiatePaymentRequestInput`.
- `admin-cancel-payment-request.input.ts`: `AdminCancelPaymentRequestInput`.

**Acceptance criteria**:
- Server starts; `schema.gql` includes all new types, enums, inputs, queries, mutations.
- All required fields are non-nullable in schema.
- Optional fields are nullable.
- `owner`, `currency`, `reviewedBy`, `paidBy` can be resolved (mapper provides them).

---

## S-020 — Resolver: `PaymentRequestsResolver`

Class-level: `@UseGuards(GqlAuthGuard)`.

| Method | Guards | Role |
|--------|--------|------|
| `myPaymentRequests` | `ActiveUserGuard` | CLIENT (VIP) |
| `systemCashPickupAddress` | `ActiveUserGuard` | CLIENT (VIP) |
| `createPaymentRequest` | `ActiveUserGuard` | CLIENT (VIP) |
| `clientAcceptPaymentRequest` | `ActiveUserGuard` | CLIENT (VIP) |
| `clientCancelPaymentRequest` | `ActiveUserGuard` | CLIENT (VIP) |
| `adminPaymentRequests` | `RolesGuard` + `@Roles(ADMIN)` | ADMIN |
| `adminRenegotiatePaymentRequest` | `RolesGuard` + `@Roles(ADMIN)` | ADMIN |
| `adminAcceptPaymentRequest` | `RolesGuard` + `@Roles(ADMIN)` | ADMIN |
| `adminCompletePaymentRequest` | `RolesGuard` + `@Roles(ADMIN)` | ADMIN |
| `adminCancelPaymentRequest` | `RolesGuard` + `@Roles(ADMIN)` | ADMIN |

Each state-changing method calls `recordUserActionLogSafe` after the use-case succeeds.

**Acceptance criteria**:
- All resolvers registered in schema.
- Unauthenticated access to any resolver returns `Unauthorized`.
- CLIENT role accessing admin mutations returns `Forbidden`.

---

## S-021 — Module: `PaymentRequestsModule`

**Imports**: `UsersModule`, `InternalNotificationsModule`, `SystemSettingsModule`,
`CatalogsModule`, `VipPricingModule`, `UserActionLogsModule`.

**Providers**:
- `PrismaPaymentRequestCommandAdapter`
- `PrismaPaymentRequestQueryAdapter`
- `{ provide: PAYMENT_REQUEST_COMMAND_PORT, useExisting: PrismaPaymentRequestCommandAdapter }`
- `{ provide: PAYMENT_REQUEST_QUERY_PORT, useExisting: PrismaPaymentRequestQueryAdapter }`
- All 10 use-cases.
- `PaymentRequestsResolver`.

Register `PaymentRequestsModule` in `AppModule`.

**Acceptance criteria**:
- `npm run build` succeeds.
- Server starts; no circular dependency errors.
- All use-cases resolvable via DI.

---

## S-022 — End-to-end validation (smoke)

Manual smoke test sequence:

**Flow A — happy path (renegotiate → accept → complete)**

1. Authenticate as a VIP client (balance = B).
2. `createPaymentRequest` (CASH, no delivery, amount = A where A ≤ B) → assert `status=REQUESTED`.
3. `myPaymentRequests` → assert 1 result.
4. As admin: `adminPaymentRequests` → assert 1 result.
5. As admin: `adminRenegotiatePaymentRequest(newAmount = A’ where A’ ≤ A)` → assert `status=RENEGOTIATING`.
6. As VIP: `clientAcceptPaymentRequest` → assert `status=ACCEPTED`.
7. As admin: `adminCompletePaymentRequest` → assert `status=PAID`.
   Assert `User.totalGeneratedAmount` decremented by **A’** (not A — renegotiated amount).
8. Repeat step 7 (call again) → assert idempotent: returns `PAID` record,
   `totalGeneratedAmount` unchanged (no second decrement).

**Flow B — over-requesting guard**

9. VIP client has `totalGeneratedAmount = 100`.
10. `createPaymentRequest(amount = 80)` → assert `status=REQUESTED`. `availableBalance` = 20.
11. `createPaymentRequest(amount = 30)` → assert **fails** with
    `ValidationDomainException('Insufficient available VIP balance')`
    (80 already reserved; only 20 available).

**Flow C — cancel releases reserved balance**

12. `clientCancelPaymentRequest` on the request from step 10 → assert `status=CANCELED_BY_CLIENT`.
13. `createPaymentRequest(amount = 30)` → assert **succeeds** (balance fully available again).

**Flow D — cancellations**

14. Create a new request; as VIP: `clientCancelPaymentRequest` → assert `status=CANCELED_BY_CLIENT`.
15. Create a new request; as admin: `adminCancelPaymentRequest` → assert `status=CANCELED_BY_ADMIN`.
16. Check internal notifications for each relevant user.

**Acceptance criteria**: All 16 steps complete without error;
- `totalGeneratedAmount` decremented exactly once per completed request, and by `effectiveAmount`.
- Over-request in step 11 is rejected even though `amount ≤ totalGeneratedAmount`.
- Canceling in step 12 restores the full available balance.
- All 6 notification types fan out to correct recipients.
- `UserActionLog` entries created for all state-changing operations.
