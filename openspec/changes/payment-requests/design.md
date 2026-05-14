# Design: Payment Requests — VIP Cash-Out Module

## Design status

OPEN - PENDING IMPLEMENTATION

---

## 1. Prisma Schema Changes

### New enums

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

### New model

```prisma
model PaymentRequest {
  id            String               @id @default(uuid())
  ownerUserId   String
  amount        Decimal              // gross amount to withdraw from totalGeneratedAmount
  currencyId    String               // currency in which the client wants to receive payment
  exchangeRate  Decimal              // VipExchangeRate snapshot at creation time (currencyId → USD)
  deliveryFee   Decimal              @default(0) // always in USD; 0 if no delivery
  amountToPay   Decimal              // amount client receives = amount - deliveryFee (in currency)
  method        PaymentRequestMethod
  account       String?              // required when method=TRANSFER; null otherwise
  address       String?              // required when method=CASH && delivery=true
  delivery      Boolean              @default(false)
  newAmount     Decimal?             // set by admin during RENEGOTIATING
  status        PaymentRequestStatus @default(REQUESTED)
  reviewedById  String?              // admin who renegotiated or accepted
  reviewedAt    DateTime?
  paidById      String?              // admin who marked PAID
  paidAt        DateTime?
  canceledReason String?
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  owner      User  @relation("PaymentRequestOwner", fields: [ownerUserId], references: [id])
  currency   CurrencyCatalog @relation(fields: [currencyId], references: [id])
  reviewedBy User? @relation("PaymentRequestReviewer", fields: [reviewedById], references: [id])
  paidBy     User? @relation("PaymentRequestPaidBy", fields: [paidById], references: [id])

  @@index([ownerUserId, createdAt])
  @@index([status, createdAt])
  @@index([ownerUserId, status])
}
```

### Field rationale

| Field | Decision |
|-------|----------|
| `amount` | Gross amount debited from `totalGeneratedAmount`. Client-provided. |
| `currencyId` | Currency of the requested payout (may differ from USD). |
| `exchangeRate` | Snapshot of `VipExchangeRate.rate` at creation time. If `currencyId` is USD, rate = 1. |
| `deliveryFee` | Always 0 unless `delivery=true`. Stored in USD equivalent. |
| `amountToPay` | Computed at creation: `amount - deliveryFee` (in requested currency). Stored for audit. |
| `newAmount` | Admin-proposed lower amount during renegotiation (≤ original `amount`). |
| `account` | Bank account / IBAN / wallet ID string; free text; required for TRANSFER. |
| `address` | Physical delivery address; required for CASH+delivery. |
| `canceledReason` | Free text reason supplied by admin or client at cancellation. |

**Why `amountToPay` and not `finalAmount`**: The name `amountToPay` is already used as a
conceptual field in remittances in this codebase and communicates the "what the counterpart
receives" semantics better. `finalAmount` is too generic.

### New `UserActionLogAction` values

```prisma
CREATE_PAYMENT_REQUEST
CLIENT_ACCEPT_PAYMENT_REQUEST
CLIENT_CANCEL_PAYMENT_REQUEST
ADMIN_RENEGOTIATE_PAYMENT_REQUEST
ADMIN_ACCEPT_PAYMENT_REQUEST
ADMIN_COMPLETE_PAYMENT_REQUEST
ADMIN_CANCEL_PAYMENT_REQUEST
```

### New `InternalNotificationType` values

```prisma
NEW_PAYMENT_REQUEST
PAYMENT_REQUEST_RENEGOTIATED
PAYMENT_REQUEST_ACCEPTED
PAYMENT_REQUEST_PAID
PAYMENT_REQUEST_CANCELED_BY_ADMIN
PAYMENT_REQUEST_CANCELED_BY_CLIENT
```

### New `SystemSetting` seeds

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `CASH_PICKUP_ADDRESS` | STRING | `"TBD - Contact admin"` | Address shown to clients who choose CASH + no delivery |
| `CASH_DELIVERY_FEE_USD` | NUMBER | `"10"` | Delivery surcharge in USD (subtracted from payout) |
| `CASH_DELIVERY_MIN_AMOUNT_USD` | NUMBER | `"1000"` | Minimum request amount (USD) required to enable delivery option |

---

## 2. State Machine

```
REQUESTED ──────────────────────────────► RENEGOTIATING
    │                                           │
    ├──────────────────────────────────────► ACCEPTED
    │                                           │
    ├──────────────────────────────────────► CANCELED_BY_ADMIN (final)
    │                                           │
    └──────────────────────────────────────► CANCELED_BY_CLIENT (final)
                                               │
                                         RENEGOTIATING
                                               ├──► ACCEPTED
                                               ├──► CANCELED_BY_ADMIN (final)
                                               └──► CANCELED_BY_CLIENT (final)

                                         ACCEPTED
                                               ├──► PAID (final)
                                               └──► CANCELED_BY_ADMIN (final)
```

### Transition table

| From | To | Actor | Trigger |
|------|----|-------|---------|
| REQUESTED | RENEGOTIATING | ADMIN | `adminRenegotiatePaymentRequest` |
| REQUESTED | ACCEPTED | ADMIN | `adminAcceptPaymentRequest` |
| REQUESTED | CANCELED_BY_ADMIN | ADMIN | `adminCancelPaymentRequest` |
| REQUESTED | CANCELED_BY_CLIENT | CLIENT | `clientCancelPaymentRequest` |
| RENEGOTIATING | ACCEPTED | CLIENT | `clientAcceptPaymentRequest` |
| RENEGOTIATING | CANCELED_BY_ADMIN | ADMIN | `adminCancelPaymentRequest` |
| RENEGOTIATING | CANCELED_BY_CLIENT | CLIENT | `clientCancelPaymentRequest` |
| ACCEPTED | PAID | ADMIN | `adminCompletePaymentRequest` |
| ACCEPTED | CANCELED_BY_ADMIN | ADMIN | `adminCancelPaymentRequest` |

### Final states (no further transitions)

`PAID`, `CANCELED_BY_ADMIN`, `CANCELED_BY_CLIENT`

---

## 3. Business Rules

### VIP check
- `user.isVip === true` required for all client mutations. Throw `ForbiddenDomainException`.

### Amount validation

- `amount` must be `> 0`.
- `totalGeneratedAmount` is in USD. If `currencyId ≠ USD`, convert:
  `amountInUSD = amount / exchangeRate`.
- **Available-balance check** (prevents over-requesting across concurrent active requests):
  ```
  activeSum  = SUM(amount) of all PaymentRequests owned by user
               WHERE status IN (REQUESTED, RENEGOTIATING, ACCEPTED)
  availableBalance = user.totalGeneratedAmount − activeSum
  ```
  Assert `amountInUSD ≤ availableBalance`.
  Throw `ValidationDomainException('Insufficient available VIP balance')` if not.

**Active statuses** (counted in `activeSum`):
- `REQUESTED`, `RENEGOTIATING`, `ACCEPTED`

**Inactive statuses** (excluded from `activeSum`):
- `PAID`, `CANCELED_BY_ADMIN`, `CANCELED_BY_CLIENT`

Rationale: When a request reaches a terminal state, the reserved amount is automatically
freed — no explicit release step is needed because the sum is computed dynamically.

### Method constraints — TRANSFER
- `account` must be non-null and non-empty.
- `address` must be null.
- `delivery` must be false.

### Method constraints — CASH
- `account` must be null.
- If `delivery = false`: `address` must be null (pickup uses `CASH_PICKUP_ADDRESS` SystemSetting).
- If `delivery = true`: `address` must be non-null and non-empty.
- `delivery = true` only allowed when `amountInUSD > CASH_DELIVERY_MIN_AMOUNT_USD`.

### Delivery fee
- If `delivery = true`: `deliveryFee = CASH_DELIVERY_FEE_USD` (in USD, converted to currency).
  Formula: `deliveryFeeInCurrency = deliveryFeeUSD / exchangeRate`.
  `amountToPay = amount - deliveryFeeInCurrency`.
- If `delivery = false`: `deliveryFee = 0`, `amountToPay = amount`.

### Renegotiation
- Only admin can renegotiate.
- `newAmount` must be `> 0` and `≤ amount`.
- Status transitions to `RENEGOTIATING`.
- `reviewedById` and `reviewedAt` are set.

### Client accept (after renegotiation)
- Only the owner can accept.
- Only valid from `RENEGOTIATING` status.
- Status transitions to `ACCEPTED`.

### Admin complete (payment)
- Only admin can complete.
- Only valid from `ACCEPTED` status.
- **Idempotency pattern** (replaces optimistic status re-check):
  Use `prisma.paymentRequest.updateMany({ where: { id, status: ACCEPTED }, data: { status: PAID, paidById, paidAt } })`.
  If `count === 0` the record is already `PAID` — skip the balance decrement and return the
  existing record. This avoids a dedicated pre-read and eliminates the TOCTOU race.
- **Transactional decrement**: inside a single Prisma transaction:
  1. `updateMany WHERE id=X AND status=ACCEPTED` — capture count.
  2. If count = 0: re-fetch and return (idempotent path, no decrement).
  3. Compute `effectiveAmount` = `request.newAmount ?? request.amount`.
  4. Re-fetch `User.totalGeneratedAmount`.
  5. Verify `user.totalGeneratedAmount ≥ effectiveAmount` (prevent negative balance).
  6. Decrement `user.totalGeneratedAmount` by `effectiveAmount`.
- **`effectiveAmount`**: `newAmount` if admin renegotiated; otherwise `amount` (gross).
  Rationale: if admin accepted a lower `newAmount`, only that smaller amount should be
  debited from the balance. This also prevents the system from charging the original
  gross amount after a renegotiation.

### Cancellation
- Client can cancel from `REQUESTED` or `RENEGOTIATING`.
- Admin can cancel from `REQUESTED`, `RENEGOTIATING`, or `ACCEPTED`.
- `canceledReason` is optional for client; recommended for admin.
- No `totalGeneratedAmount` change on cancellation.

---

## 4. GraphQL Contract

### Types

```graphql
type PaymentRequest {
  id: ID!
  ownerUserId: ID!
  owner: UserType!           # resolved via DataLoader or eager join
  amount: String!            # Decimal serialized as string
  currencyId: ID!
  currency: CurrencyCatalog!
  exchangeRate: String!
  deliveryFee: String!
  amountToPay: String!
  method: PaymentRequestMethod!
  account: String
  address: String
  delivery: Boolean!
  newAmount: String
  status: PaymentRequestStatus!
  reviewedById: ID
  reviewedBy: UserType
  reviewedAt: DateTime
  paidById: ID
  paidBy: UserType
  paidAt: DateTime
  canceledReason: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum PaymentRequestStatus {
  REQUESTED RENEGOTIATING ACCEPTED PAID CANCELED_BY_ADMIN CANCELED_BY_CLIENT
}

enum PaymentRequestMethod {
  TRANSFER CASH
}
```

### Client mutations

```graphql
# Requires: GqlAuthGuard + ActiveUserGuard
# VIP check: inside use-case
mutation createPaymentRequest(input: CreatePaymentRequestInput!): PaymentRequest!

input CreatePaymentRequestInput {
  amount: String!               # Decimal string
  currencyId: ID!
  method: PaymentRequestMethod!
  account: String               # required if TRANSFER
  address: String               # required if CASH + delivery=true
  delivery: Boolean!
}

# Requires: GqlAuthGuard + ActiveUserGuard
# Validates: owner, status=RENEGOTIATING
mutation clientAcceptPaymentRequest(id: ID!): PaymentRequest!

# Requires: GqlAuthGuard + ActiveUserGuard
# Validates: owner, status in [REQUESTED, RENEGOTIATING]
mutation clientCancelPaymentRequest(id: ID!, reason: String): PaymentRequest!
```

### Client queries

```graphql
# Requires: GqlAuthGuard + ActiveUserGuard
query myPaymentRequests(input: MyPaymentRequestsInput): [PaymentRequest!]!

input MyPaymentRequestsInput {
  status: PaymentRequestStatus
  dateFrom: DateTime
  dateTo: DateTime
  offset: Int
  limit: Int                    # default 20, max 100
}

# Optional — retrieve system pickup address (VIP only)
query systemCashPickupAddress: String!
```

### Admin mutations

```graphql
# All require: GqlAuthGuard + RolesGuard + @Roles(ADMIN)

mutation adminRenegotiatePaymentRequest(input: AdminRenegotiatePaymentRequestInput!): PaymentRequest!

input AdminRenegotiatePaymentRequestInput {
  id: ID!
  newAmount: String!
  reason: String
}

mutation adminAcceptPaymentRequest(id: ID!): PaymentRequest!

mutation adminCompletePaymentRequest(id: ID!): PaymentRequest!

mutation adminCancelPaymentRequest(input: AdminCancelPaymentRequestInput!): PaymentRequest!

input AdminCancelPaymentRequestInput {
  id: ID!
  reason: String
}
```

### Admin queries

```graphql
# Requires: GqlAuthGuard + RolesGuard + @Roles(ADMIN)
query adminPaymentRequests(input: AdminPaymentRequestsInput!): [PaymentRequest!]!

input AdminPaymentRequestsInput {
  status: PaymentRequestStatus
  ownerUserId: ID
  method: PaymentRequestMethod
  dateFrom: DateTime
  dateTo: DateTime
  offset: Int
  limit: Int                    # default 20, max 100
}
```

---

## 5. Notifications

| Event | Type | Recipients |
|-------|------|-----------|
| `createPaymentRequest` | `NEW_PAYMENT_REQUEST` | All ADMINs |
| `adminRenegotiatePaymentRequest` | `PAYMENT_REQUEST_RENEGOTIATED` | Owner (VIP client) |
| `clientAcceptPaymentRequest` | `PAYMENT_REQUEST_ACCEPTED` | All ADMINs |
| `adminAcceptPaymentRequest` | `PAYMENT_REQUEST_ACCEPTED` | Owner (VIP client) |
| `adminCompletePaymentRequest` | `PAYMENT_REQUEST_PAID` | Owner (VIP client) |
| `adminCancelPaymentRequest` | `PAYMENT_REQUEST_CANCELED_BY_ADMIN` | Owner (VIP client) |
| `clientCancelPaymentRequest` | `PAYMENT_REQUEST_CANCELED_BY_CLIENT` | All ADMINs |

Notifications are non-blocking (wrapped in `*Safe` private methods in use-cases).
`referenceId` = `paymentRequest.id`.

---

## 6. Module Directory Structure (target)

```
src/modules/payment-requests/
├── application/
│   └── use-cases/
│       ├── create-payment-request.usecase.ts
│       ├── my-payment-requests.usecase.ts
│       ├── client-accept-payment-request.usecase.ts
│       ├── client-cancel-payment-request.usecase.ts
│       ├── system-cash-pickup-address.usecase.ts
│       ├── admin-payment-requests.usecase.ts
│       ├── admin-renegotiate-payment-request.usecase.ts
│       ├── admin-accept-payment-request.usecase.ts
│       ├── admin-complete-payment-request.usecase.ts
│       └── admin-cancel-payment-request.usecase.ts
├── domain/
│   ├── ports/
│   │   ├── payment-request-command.port.ts
│   │   └── payment-request-query.port.ts
│   └── exceptions/
│       └── payment-request.exceptions.ts
├── infrastructure/
│   └── adapters/
│       ├── prisma-payment-request-command.adapter.ts
│       └── prisma-payment-request-query.adapter.ts
├── presentation/
│   └── graphql/
│       ├── inputs/
│       │   ├── create-payment-request.input.ts
│       │   ├── my-payment-requests.input.ts
│       │   ├── admin-payment-requests.input.ts
│       │   ├── admin-renegotiate-payment-request.input.ts
│       │   └── admin-cancel-payment-request.input.ts
│       ├── types/
│       │   └── payment-request.type.ts
│       ├── mappers/
│       │   └── payment-request.mapper.ts
│       └── resolvers/
│           └── payment-requests.resolver.ts
└── payment-requests.module.ts
```

---

## 7. Cross-Module Dependencies

| Dependency | Purpose | Injection |
|------------|---------|-----------|
| `InternalNotificationCommandPort` | Send notifications to users/admins | Port token; injected in use-cases |
| `UserQueryPort` | Fetch user for VIP check, balance check, admin fanout | Port token from `users` module |
| `SystemSettingQueryPort` | Read `CASH_PICKUP_ADDRESS`, `CASH_DELIVERY_FEE_USD`, `CASH_DELIVERY_MIN_AMOUNT_USD` | Port token from `system-settings` module |
| `VipExchangeRateQueryPort` | Snapshot exchange rate at request creation | Port token from `vip-pricing` module |
| `RecordUserActionLogUseCase` | Audit trail (injected in resolver) | Direct class injection |
| `CurrencyCatalogQueryPort` | Validate `currencyId` exists and is enabled | Port token from `catalogs` module |
| `PaymentRequestQueryPort.sumActiveAmounts` | Compute reserved balance for available-balance guard | Own module; injected in `CreatePaymentRequestUseCase` |

---

## 8. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| `amount` semantics | Gross withdrawal from balance | Clear separation: client states how much they want out; fee is deducted transparently |
| Fee position | Deducted from payout (`amountToPay = amount - fee`) | Client bears cost; balance decrements by gross amount (simpler accounting) |
| `totalGeneratedAmount` decrement value | `effectiveAmount` = `newAmount ?? amount` | If admin renegotiated, only the accepted lower amount should be debited |
| Balance guard at creation | `availableBalance = totalGeneratedAmount − activeSum` | Prevents over-requesting across multiple concurrent active requests |
| Active statuses for `activeSum` | `REQUESTED`, `RENEGOTIATING`, `ACCEPTED` | These three statuses represent committed but unpaid exposure |
| Idempotency mechanism | `updateMany WHERE status=ACCEPTED` — count=0 → skip decrement | Atomic row-level lock without a separate read; eliminates TOCTOU race |
| Rate source | `VipExchangeRate` snapshot at creation | VIP clients should receive VIP rates; snapshot prevents later-rate surprises |
| `newAmount` renegotiation | One round only per design (admin sets once, client accepts) | Simplest UX; additional rounds require new `REQUESTED` if rejected |
| `canceledReason` | Optional string (no enum) | Free text gives flexibility; enum can be added later |
