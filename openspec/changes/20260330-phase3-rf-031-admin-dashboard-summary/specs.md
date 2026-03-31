# Specs: Phase 3 RF-031 Admin Dashboard Summary

## Scope mapping

Included:

- RF-031

Explicitly reused capabilities:

- RF-033
- RF-038
- RF-039
- RF-040

Excluded:

- RF-041
- RF-042
- RF-043

## Acceptance criteria

- [x] AC-1: Consolidated admin dashboard query exists
  - GraphQL query `adminDashboardSummary(input)` exists.
  - Query returns a single structured summary payload.

- [x] AC-2: Period filters are mandatory and explicit
  - `dateFrom` and `dateTo` are required.
  - `grouping` is required for trend output.
  - Optional filters: `status`, `userId`, `paymentMethodCode`.

- [x] AC-3: KPI definitions are backend-defined and stable
  - `totalTransactions` maps to filtered remittance count.
  - `totalPaymentAmount` maps to filtered total payment amount.
  - `totalReceivingAmount` maps to filtered total receiving amount.

- [x] AC-4: Period trend is included and grouped
  - Response includes period buckets by DAILY/WEEKLY/MONTHLY.
  - Buckets honor selected period filters.

- [x] AC-5: Payment method ranking is included
  - Response includes top payment methods by usage count.
  - Ranking includes usage count and total amount.
  - Ranking can be limited by `topPaymentMethodsLimit`.

- [x] AC-6: Existing reporting foundations are reused
  - Dashboard summary composes results from existing reporting use-cases and/or equivalent existing aggregates.
  - No duplicate business semantics introduced.

- [x] AC-7: Query is admin-only
  - Protected by existing auth and admin role guards.

- [x] AC-8: Contract-safe behavior
  - Existing reporting queries remain available and behavior-compatible.
  - No breaking changes in remittance submit/lifecycle/external payment flows.

- [x] AC-9: Out-of-scope protection
  - No RF-041 implementation.
  - No RF-042 implementation.
  - No export pipeline implementation.

- [x] AC-10: Build/runtime/schema validation passes
  - `npm run build` succeeds.
  - `PORT=3001 npm run start:dev` succeeds.
  - `src/schema.gql` includes dashboard summary contract.

## Functional clarifications fixed by this spec

- Dashboard summary is a backend contract, not a frontend layout definition.
- KPI calculations are canonicalized in backend to avoid frontend divergence.
- Timezone follows current reporting baseline (UTC) unless explicitly changed by future scope.

## Closure evidence

- Status: CLOSED / IMPLEMENTED / VALIDATED.
- Local validation executed: build, runtime bootstrap, schema regeneration, dashboard smoke query.
- No relevant regressions observed in existing reporting and remittance flows.
