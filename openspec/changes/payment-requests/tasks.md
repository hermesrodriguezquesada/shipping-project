# Tasks: Payment Requests — VIP Cash-Out Module

## Status

OPEN - PENDING IMPLEMENTATION

---

## Implementation plan

### Phase 1 — Schema & Infrastructure (no runtime behavior)

**T-001** — Add `PaymentRequestStatus` and `PaymentRequestMethod` enums to `schema.prisma`

- Spec: S-001
- Files: `prisma/schema.prisma`
- Notes: Append after existing enums; run `prisma generate` to verify.

---

**T-002** — Add `PaymentRequest` model to `schema.prisma` and `User` back-relations

- Spec: S-002
- Files: `prisma/schema.prisma`
- Depends on: T-001
- Notes: Add all fields from design.md §1. Add 3 back-relations to `User`.
  Run `prisma generate`.

---

**T-003** — Extend `InternalNotificationType` and `UserActionLogAction` with new values

- Spec: S-003
- Files: `prisma/schema.prisma`
- Notes: Append-only; no existing values changed.

---

**T-004** — Create and apply Prisma migration

- Files: `prisma/migrations/<timestamp>_payment_requests/`
- Depends on: T-001, T-002, T-003
- Notes: Run `prisma migrate dev --name payment_requests`. Verify SQL covers all indexes.

---

**T-005** — Add 3 new SystemSetting seeds

- Spec: S-004
- Files: `prisma/seed.ts`
- Depends on: T-004
- Notes: Use upsert pattern matching existing seed entries.
  Keys: `CASH_PICKUP_ADDRESS`, `CASH_DELIVERY_FEE_USD`, `CASH_DELIVERY_MIN_AMOUNT_USD`.

---

**T-006** — Add port tokens to shared constants

- Spec: S-006
- Files: `src/shared/constants/tokens.ts`
- Notes: `PAYMENT_REQUEST_COMMAND_PORT`, `PAYMENT_REQUEST_QUERY_PORT`.

---

### Phase 2 — Domain Layer (ports + exceptions)

**T-007** — Create domain ports

- Spec: S-005
- Files:
  - `src/modules/payment-requests/domain/ports/payment-request-command.port.ts`
  - `src/modules/payment-requests/domain/ports/payment-request-query.port.ts`
- Notes: Pure TS interfaces; no Prisma imports. Define entity types inline or in a separate
  `payment-request.entity.ts` file in `domain/`.

---

**T-008** — Create domain exceptions

- Files: `src/modules/payment-requests/domain/exceptions/payment-request.exceptions.ts`
- Notes: Reuse or extend existing `DomainException` / `ForbiddenDomainException` base classes
  from the codebase. Define typed messages for each business rule violation.

---

### Phase 3 — Infrastructure Layer (Prisma adapters)

**T-009** — Create `PrismaPaymentRequestCommandAdapter`

- Spec: S-017
- Files: `src/modules/payment-requests/infrastructure/adapters/prisma-payment-request-command.adapter.ts`
- Depends on: T-007
- Notes: Implement `create`, `updateStatus`, `renegotiate`, `completeAndDecrementBalance`.
  The last method uses `prisma.$transaction` with idempotency check and balance guard.

---

**T-010** — Create `PrismaPaymentRequestQueryAdapter`

- Spec: S-018
- Files: `src/modules/payment-requests/infrastructure/adapters/prisma-payment-request-query.adapter.ts`
- Depends on: T-007
- Notes: Implement `findById`, `findByIdOrThrow`, `findMany` with all filters.
  Include `owner`, `currency`, `reviewedBy`, `paidBy` via Prisma `include`.
  Also implement `sumActiveAmounts(ownerUserId)` using `prisma.paymentRequest.aggregate`
  with `where: { ownerUserId, status: { in: [REQUESTED, RENEGOTIATING, ACCEPTED] } }`
  and `_sum: { amount: true }`. Return `Decimal(0)` if no active requests exist.

---

### Phase 4 — Application Layer (use-cases)

**T-011** — `CreatePaymentRequestUseCase`

- Spec: S-007
- Files: `src/modules/payment-requests/application/use-cases/create-payment-request.usecase.ts`
- Depends on: T-009, T-010
- Injects: `PAYMENT_REQUEST_COMMAND_PORT`, `PAYMENT_REQUEST_QUERY_PORT`, `USER_QUERY_PORT`,
  `VIP_EXCHANGE_RATE_QUERY_PORT`, `SYSTEM_SETTING_QUERY_PORT`, `CURRENCY_CATALOG_QUERY_PORT`,
  `INTERNAL_NOTIFICATION_COMMAND_PORT`
- Notes: Full validation chain. Non-blocking admin notification fanout.
  **Available-balance check** (step 5 in S-007): call `PaymentRequestQueryPort.sumActiveAmounts`
  to compute reserved amount, then derive `availableBalance = totalGeneratedAmount − activeSum`.
  Assert `amountInUSD ≤ availableBalance`; throw `ValidationDomainException('Insufficient available VIP balance')`.

---

**T-012** — `MyPaymentRequestsUseCase`

- Spec: S-008
- Files: `src/modules/payment-requests/application/use-cases/my-payment-requests.usecase.ts`
- Depends on: T-010
- Injects: `PAYMENT_REQUEST_QUERY_PORT`, `USER_QUERY_PORT`

---

**T-013** — `ClientAcceptPaymentRequestUseCase`

- Spec: S-009
- Files: `src/modules/payment-requests/application/use-cases/client-accept-payment-request.usecase.ts`
- Depends on: T-009, T-010
- Injects: `PAYMENT_REQUEST_COMMAND_PORT`, `PAYMENT_REQUEST_QUERY_PORT`,
  `USER_QUERY_PORT`, `INTERNAL_NOTIFICATION_COMMAND_PORT`

---

**T-014** — `ClientCancelPaymentRequestUseCase`

- Spec: S-010
- Files: `src/modules/payment-requests/application/use-cases/client-cancel-payment-request.usecase.ts`
- Depends on: T-009, T-010

---

**T-015** — `SystemCashPickupAddressUseCase`

- Spec: S-011
- Files: `src/modules/payment-requests/application/use-cases/system-cash-pickup-address.usecase.ts`
- Depends on: nothing (reads SystemSetting only)
- Injects: `SYSTEM_SETTING_QUERY_PORT`

---

**T-016** — `AdminPaymentRequestsUseCase`

- Spec: S-012
- Files: `src/modules/payment-requests/application/use-cases/admin-payment-requests.usecase.ts`
- Depends on: T-010

---

**T-017** — `AdminRenegotiatePaymentRequestUseCase`

- Spec: S-013
- Files: `src/modules/payment-requests/application/use-cases/admin-renegotiate-payment-request.usecase.ts`
- Depends on: T-009, T-010

---

**T-018** — `AdminAcceptPaymentRequestUseCase`

- Spec: S-014
- Files: `src/modules/payment-requests/application/use-cases/admin-accept-payment-request.usecase.ts`
- Depends on: T-009, T-010

---

**T-019** — `AdminCompletePaymentRequestUseCase`

- Spec: S-015
- Files: `src/modules/payment-requests/application/use-cases/admin-complete-payment-request.usecase.ts`
- Depends on: T-009, T-010
- Notes: Critical path — idempotency and transactional balance decrement.
  **Idempotency**: implemented via `updateMany WHERE status=ACCEPTED` in the adapter.
  If count = 0, skip decrement and return existing `PAID` record.
  **`effectiveAmount`**: read `request.newAmount ?? request.amount` after the update succeeds;
  decrement `totalGeneratedAmount` by that value, not by raw `amount`.

---

**T-020** — `AdminCancelPaymentRequestUseCase`

- Spec: S-016
- Files: `src/modules/payment-requests/application/use-cases/admin-cancel-payment-request.usecase.ts`
- Depends on: T-009, T-010

---

### Phase 5 — Presentation Layer (GraphQL)

**T-021** — Create GraphQL types

- Spec: S-019
- Files:
  - `src/modules/payment-requests/presentation/graphql/types/payment-request.type.ts`
  - (optional) `src/modules/payment-requests/presentation/graphql/mappers/payment-request.mapper.ts`
- Notes: `Decimal` fields → `@Field(() => String)`. Relations must be nullable-safe.
  Reuse `UserType` for `owner`, `reviewedBy`, `paidBy`.

---

**T-022** — Create GraphQL input DTOs

- Spec: S-019
- Files:
  - `src/modules/payment-requests/presentation/graphql/inputs/create-payment-request.input.ts`
  - `src/modules/payment-requests/presentation/graphql/inputs/my-payment-requests.input.ts`
  - `src/modules/payment-requests/presentation/graphql/inputs/admin-payment-requests.input.ts`
  - `src/modules/payment-requests/presentation/graphql/inputs/admin-renegotiate-payment-request.input.ts`
  - `src/modules/payment-requests/presentation/graphql/inputs/admin-cancel-payment-request.input.ts`
- Notes: Follow `VipPaymentProofListInput` / `AdminTransactionsFilterInput` patterns.
  Use `@IsOptional()`, `@IsEnum()`, `@IsUUID()`, `@IsDecimal()` / `@IsString()` as needed.
  `amount` and `newAmount` are Decimal strings — validate with `@IsNumberString()` or `@IsDecimal({ decimal_digits: '0,10' })`.

---

**T-023** — Create `PaymentRequestsResolver`

- Spec: S-020
- Files: `src/modules/payment-requests/presentation/graphql/resolvers/payment-requests.resolver.ts`
- Depends on: T-011 through T-022
- Notes:
  - Class-level `@UseGuards(GqlAuthGuard)`.
  - All 10 operations wired to use-cases.
  - All state-changing mutations call `recordUserActionLogSafe`.
  - Use `@CurrentUser()` decorator to extract authenticated user.

---

**T-024** — Create `PaymentRequestsModule` and register in `AppModule`

- Spec: S-021
- Files:
  - `src/modules/payment-requests/payment-requests.module.ts`
  - `src/app.module.ts`
- Depends on: all previous tasks
- Notes: Wire all providers and port bindings. Import `UsersModule`,
  `InternalNotificationsModule`, `SystemSettingsModule`, `CatalogsModule`,
  `VipPricingModule`, `UserActionLogsModule`.

---

### Phase 6 — Validation

**T-025** — Build and smoke-test

- Spec: S-022
- Steps:
  1. `npm run build` — zero errors.
  2. `PORT=3001 npm run start:dev` — server starts.
  3. Verify `schema.gql` includes all new types, enums, inputs, queries, mutations.
  4. Execute **Flow A** (steps 1–8): happy path with renegotiation; assert `totalGeneratedAmount`
     decremented by **renegotiated** `newAmount`, not original `amount`.
  5. Execute **Flow B** (steps 9–11): over-requesting guard;
     assert second request fails with `Insufficient available VIP balance`
     even though `amount ≤ totalGeneratedAmount`.
  6. Execute **Flow C** (steps 12–13): cancel releases balance;
     assert request that previously failed now succeeds after cancellation.
  7. Execute **Flow D** (steps 14–16): client and admin cancellations.
  8. Verify `totalGeneratedAmount` decremented exactly once per completed request.

---

## Task dependency graph

```
T-001
  └─► T-002 ──┐
T-003          ├─► T-004 ──► T-005
               │
T-006 ──► T-007 ──► T-008
               │
               ├─► T-009 ──┐
               └─► T-010 ──┼─► T-011 ──┐
                            ├─► T-012   │
                            ├─► T-013   │
                            ├─► T-014   │
                            ├─► T-015   ├─► T-021
                            ├─► T-016   ├─► T-022 ──► T-023 ──► T-024 ──► T-025
                            ├─► T-017   │
                            ├─► T-018   │
                            ├─► T-019 ──┘
                            └─► T-020
```

---

## VIP check — implementation reminder

There is no `VipGuard`. Every client-facing use-case must explicitly check:

```ts
const user = await this.userQuery.findById(senderUserId);
if (!user || !user.isVip) {
  throw new ForbiddenDomainException('Only VIP users can perform this action');
}
```

This pattern must be consistent across: `CreatePaymentRequestUseCase`,
`MyPaymentRequestsUseCase`, `ClientAcceptPaymentRequestUseCase`,
`ClientCancelPaymentRequestUseCase`, `SystemCashPickupAddressUseCase`.

---

## Questions that must be resolved before T-011

Before starting Phase 4, confirm with the product owner:

1. **Q1**: `amount` = gross withdrawal or net payout?
   → Recommended default: gross. If overridden, update `amountToPay` formula in T-011.

2. **Q3**: Rate source for `amountToPay` calculation: `VipExchangeRate` or `ExchangeRate`?
   → Recommended default: `VipExchangeRate`. If overridden, update T-011 port injection.

3. **Q4**: Delivery fee deducted from payout or added on top?
   → Recommended default: deducted from payout. If overridden, update T-011 and T-009.

4. **Q6**: Expose `systemCashPickupAddress` query (T-015)?
   → Recommended default: yes. If no, drop T-015 and remove from T-023 and T-024.
