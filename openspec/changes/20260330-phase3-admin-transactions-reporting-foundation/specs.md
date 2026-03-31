# Specs: Phase 3 Admin Transactions and Reporting Foundation

## Scope and requirements mapping

This spec includes:

- RF-033
- RF-038
- RF-039
- RF-040

This spec excludes:

- RF-041
- RF-042
- RF-043

## Acceptance criteria

- [x] AC-1: Define and expose consolidated admin transaction listing
  - GraphQL query `adminTransactions` exists with required filters.
  - Transaction record is remittance-based and includes associated external payment summary when available.

- [x] AC-2: Consolidated listing supports minimum filters
  - dateFrom/dateTo required
  - optional status
  - optional userId
  - optional paymentMethodCode
  - optional pagination (limit/offset)

- [x] AC-3: Consolidated listing is admin-only
  - Protected with existing admin authorization guards and roles.

- [x] AC-4: Expose period report query for RF-038
  - GraphQL query `adminTransactionsPeriodReport` exists.
  - Supports grouping enum DAILY/WEEKLY/MONTHLY.
  - Returns bucketed transaction counts by period.

- [x] AC-5: Expose aggregate amount stats query for RF-039
  - GraphQL query `adminTransactionsAmountStats` exists.
  - Returns aggregated sent and received amounts for filtered range.
  - Includes remittance count in the result.

- [x] AC-6: Expose payment method usage metrics query for RF-040
  - GraphQL query `adminPaymentMethodUsageMetrics` exists.
  - Returns usage counts by payment method for filtered range.

- [x] AC-7: Reuse current domain model without redesign
  - Remittance remains primary entity.
  - ExternalPayment remains associated context only.
  - No remittance domain redesign introduced.

- [x] AC-8: No out-of-scope implementation
  - No RF-041 implementation.
  - No RF-042 implementation.
  - No exports implementation (RF-043).

- [x] AC-9: Existing flows remain compatible
  - submitRemittanceV2 behavior unchanged except strict compatibility needs.
  - Stripe/external payment processing flow unchanged beyond read/reporting exposure.

- [x] AC-10: GraphQL code-first validation passes
  - `npm run build` succeeds.
  - `PORT=3001 npm run start:dev` succeeds.
  - `src/schema.gql` contains new contract elements.

## Functional clarifications fixed by this spec

- "Transaction" means remittance plus optional associated external payment context.
- Reporting queries are distinct from operational listing queries.
- This change provides reporting foundation only; exports and geographic/commission reporting are intentionally deferred.

## Closure evidence

- Status: CLOSED / IMPLEMENTED / VALIDATED.
- Local validation executed: build, runtime bootstrap, schema regeneration, GraphQL smoke.
- Legacy query compatibility verified with no relevant regressions.
