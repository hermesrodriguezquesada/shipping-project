## Context

`User.totalGeneratedAmount` is a bare `Decimal` column that currently accumulates values from three independent code paths without currency normalisation:

| Writer | Operation | Moneda del valor |
|---|---|---|
| `PrismaVipPaymentProofCommandAdapter.confirmPending` | `+= proof.amount` | `proof.currencyId` — libre |
| `PrismaRemittanceCommandAdapter.confirmPayment` | `+= remittance.amount` | `remittance.currencyId` — USD or EUR |
| `PrismaPaymentRequestCommandAdapter.completeAndDecrementBalance` | `-= effectiveAmount` | `paymentRequest.currencyId` — varies |

`sumActiveAmounts` runs a raw `SUM(amount)` across `REQUESTED | RENEGOTIATING | ACCEPTED` requests, also without currency conversion.

The resulting `availableBalance = totalGeneratedAmount − activeSum` is compared against `amountInUSD` (which is correctly converted). This comparison is arithmetically meaningless whenever any proof or request is not in USD.

Stakeholders:
- **Frontend**: confirmed the balance display must always be USD.
- **Business**: confirmed remittances and VIP deposits are separate financial flows.
- No Prisma schema migration is needed; the column type remains `Decimal`.

---

## Goals / Non-Goals

**Goals:**
- Ensure `User.totalGeneratedAmount` is always a USD amount, invariant after this change lands.
- Proof confirmation converts `proof.amount` to USD using `VipExchangeRate` before writing.
- `sumActiveAmounts` returns a USD-normalised aggregate using per-row `exchangeRate` snapshots.
- `completeAndDecrementBalance` decrements the USD-equivalent of the effective amount.
- `Remittance.confirmPayment` stops writing `totalGeneratedAmount` entirely.
- All three mutating operations remain transactional and idempotent.

**Non-Goals:**
- Migrating existing `totalGeneratedAmount` data (Phase 2 script, out of scope here).
- Adding a new column or renaming `totalGeneratedAmount`.
- Changing the GraphQL field name or type (`String`); only the unit semantics change.
- Changing how `ExchangeRate` (general rates) is stored or consumed.
- Modifying the Prisma schema.

---

## Decisions

### D1 — Use `VipExchangeRate` (not `ExchangeRate`) for proof conversion

**Decision:** When a VIP payment proof is confirmed, convert `proof.amount → USD` using the **current enabled** `VipExchangeRate` record for the pair (`proof.currencyCode → USD` or `USD → proof.currencyCode`).

**Rationale:** VIP deposits are made at VIP rates, not market rates. Using the general `ExchangeRate` would compute a different USD base than the rate under which the deposit was made. `VipExchangeRate` is the contractual rate for VIP clients.

**Direction handling:**
- If `proof.currency == USD` → `amountUsd = proof.amount` (no lookup)
- Else if `VipExchangeRate(from=proof.currency, to=USD)` exists → `amountUsd = proof.amount * rate`
- Else if `VipExchangeRate(from=USD, to=proof.currency)` exists → `amountUsd = proof.amount / rate`
- Else → throw `ValidationDomainException('VIP exchange rate to USD not configured for this currency')`

**Alternative rejected:** Using the general `ExchangeRate` — rejects because VIP clients have preferential rates and the system already has a VIP-specific rate table.

**Alternative rejected:** Snapshotting the rate at proof creation time and storing it on `VipPaymentProof` — valid but out of scope; would require a schema migration and increases complexity. Phase 2 can revisit.

### D2 — `sumActiveAmountsUsd` uses `exchangeRate` snapshot, not live rate

**Decision:** `sumActiveAmountsUsd(ownerUserId)` will fetch all active payment requests for the user (not just the aggregate), iterate them, and compute `Σ(amount / exchangeRate)` per row using the snapshot stored on each `PaymentRequest.exchangeRate`.

**Rationale:** `PaymentRequest.exchangeRate` is a snapshot captured at request creation time. Using live rates for the sum would produce inconsistent results as VIP rates change; the snapshot is the correct base for a request that was already validated against that rate.

**Alternative rejected:** Raw SQL `SUM(amount / "exchangeRate")` in Prisma aggregate — Prisma does not support computed aggregates in `aggregate()`. A `$queryRaw` would break hexagonal architecture. Fetching rows and reducing in TypeScript is the clean approach; the active request count per user is bounded (practical limit: tens of records).

### D3 — `completeAndDecrementBalance` decrements in USD

**Decision:** The decrement becomes `User.totalGeneratedAmount -= (effectiveAmount / request.exchangeRate)`.

**Rationale:** Balances are now pure USD. A request for 2000 CUP at rate 200 (USD/CUP) must decrement 10 USD, not 2000.

**Note on `newAmount`:** If a renegotiation has set `newAmount`, `effectiveAmount = newAmount`. The `exchangeRate` snapshot does not change during renegotiation (already confirmed by discovery). Therefore `effectiveAmountUsd = newAmount / exchangeRate` is correct.

### D4 — Remove `totalGeneratedAmount` increment from `Remittance.confirmPayment`

**Decision:** Delete the `User.totalGeneratedAmount { increment }` block from `PrismaRemittanceCommandAdapter.confirmPayment` (and from `ExternalPaymentAcceptanceUseCase` comment).

**Rationale:** Business confirmed remittances and VIP balances are separate. Mixing remittance amounts into the VIP balance was an unintentional coupling. Remittances already have their own lifecycle and financial tracking in `Remittance.amount`, `commissionAmount`, `netReceivingAmount`, etc.

**Risk:** Any user who currently has `totalGeneratedAmount` partially inflated by past remittance confirmations will have an incorrect balance until Phase 2 recalculation. This is a known, accepted data risk documented in the proposal.

### D5 — Inject `VipExchangeRateQueryPort` into `AdminConfirmVipPaymentProofUseCase`

**Decision:** The use case (`admin-confirm-vip-payment-proof.usecase.ts`) will receive `VipExchangeRateQueryPort` via DI. The USD conversion logic lives **in the use case**, not in the Prisma adapter.

**Rationale:** The adapter's responsibility is persistence. Fetching and applying a rate is domain logic. Putting it in the use case keeps the adapter testable without exchange-rate stubs and keeps rate logic discoverable at the domain boundary.

**Implication:** `confirmPending` in `VipPaymentProofCommandPort` and its adapter will receive a pre-computed `amountUsd: Prisma.Decimal` parameter instead of deriving it internally.

### D6 — `sumActiveAmountsUsd` port signature change

**Decision:** `PaymentRequestQueryPort.sumActiveAmounts` is renamed to `sumActiveAmountsUsd` and its return type remains `Promise<Prisma.Decimal>` (now guaranteed USD).

**Rationale:** The rename makes the USD contract explicit at the port boundary, preventing future callers from assuming the original mixed-currency semantics.

---

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| VipExchangeRate for `proof.currencyId → USD` not configured → proof confirmation blocked | Guard with `ValidationDomainException`; admin must configure rate before confirming proofs in that currency. Document in runbook. |
| Existing `User.totalGeneratedAmount` rows contain mixed-currency amounts | Phase 2 recalculation script; add a technical debt warning log on startup until Phase 2 is executed. |
| `sumActiveAmountsUsd` fetches N rows instead of 1 aggregate query | Bounded by practical number of active requests per user (< 100); in-process reduction is safe. Add DB index `[ownerUserId, status]` if not already present (it is: `@@index([ownerUserId, status])` confirmed). |
| Remittance `totalGeneratedAmount` removal is a silent breaking change for any client that used `totalGeneratedAmount` to track remittance cashback | No current evidence of such a client (field is only read by VIP flows and user profile display). Confirm with frontend before deploying. |
| Race condition in `createPaymentRequest` (concurrent balance check + insert) | Pre-existing issue, out of scope. Documented in discovery as Risk 7. This change does not worsen it. |
| `effectiveAmountUsd` Decimal division precision | Prisma `Decimal` uses `decimal.js` (28 significant digits). Rounding should use `.toDecimalPlaces(8, Decimal.ROUND_HALF_UP)` to avoid floating-point drift accumulating across many operations. |

---

## Migration Plan

### Phase 1 — Forward logic (this change)

1. Deploy code changes (no schema migration).
2. From this point all new `totalGeneratedAmount` writes are USD-normalised.
3. Existing rows remain as-is; VIP clients with mixed historical amounts will see incorrect balances until Phase 2.
4. Operational recommendation: run Phase 2 script within the same release window or immediately after.

### Phase 2 — Historical recalculation (separate change)

Script logic (to be defined in a separate change):
```
For each User where isVip=true:
  creditUsd = SUM of CONFIRMED VipPaymentProof amounts converted to USD
                (using VipExchangeRate at time of confirmation, or current rate as fallback)
  debitUsd  = SUM of PAID PaymentRequest effectiveAmounts / exchangeRate
  User.totalGeneratedAmount = creditUsd - debitUsd
```

Rollback for Phase 1:
- Feature flag `NORMALIZE_VIP_BALANCE_USD` (env var `FEATURE_NORMALIZE_VIP_BALANCE_USD=false`) can short-circuit new conversion logic and fall back to raw amount, enabling a safe rollback without a deploy if a production issue is detected.
- The flag is optional; omit if the team prefers a redeploy-based rollback strategy.

### Rollback

Revert commits for the four changed files. No schema to roll back. Historical data is not destroyed by Phase 1.

---

## Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| OQ-1 | Does frontend currently display `totalGeneratedAmount` outside of VIP context (e.g., admin user list)? If yes, adding a `totalGeneratedAmountCurrency: "USD"` companion field may be needed. | Frontend team | Unresolved |
| OQ-2 | For proof currencies where only `USD → currencyCode` rate is configured (not the inverse), is direction resolution via division acceptable or must we require an explicit `currencyCode → USD` rate entry? | Business / Admin ops | Decision taken: division is acceptable (see D1) |
| OQ-3 | Should Phase 2 recalculation use the `VipExchangeRate` rate at the time of the original confirmation (requires storing it on `VipPaymentProof`) or the current rate? | Business | Unresolved — Phase 2 scoping |
| OQ-4 | Feature flag: opt-in vs always-on? | Engineering lead | Recommended: always-on; flag only if rollback risk is high |
