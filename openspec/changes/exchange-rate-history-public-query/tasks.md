## 1. OpenSpec alignment

- [x] 1.1 Confirm capability name `exchange-rate-history` and phase-1 scope boundaries remain limited to append-only snapshots plus public query
- [x] 1.2 Confirm visibility policy for phase 1, especially whether any `VIP` history rows can be marked `PUBLIC`
- [x] 1.3 Confirm `currencyCode` semantics as ANY match across origin or destination in the public query

## 2. Data model

- [x] 2.1 Add Prisma enum `ExchangeRateHistoryType` with `GENERAL` and `VIP` values and leave room for future extension
- [x] 2.2 Add Prisma enum or equivalent visibility model for `PUBLIC` and `PRIVATE`
- [x] 2.3 Add append-only Prisma model `ExchangeRateHistory` with snapshot fields, optional `sourceRateId`, and timestamp
- [x] 2.4 Add indexes covering visibility, type, pair filtering, and date-range filtering
- [x] 2.5 Add SQL migration for the new history model and indexes

## 3. New module and ports

- [x] 3.1 Create module structure `src/modules/exchange-rate-history/` with domain, application, infrastructure, and presentation layers
- [x] 3.2 Add domain ports `ExchangeRateHistoryRecorderPort` and `ExchangeRateHistoryQueryPort`
- [x] 3.3 Implement Prisma adapter for append-only history insertion
- [x] 3.4 Implement Prisma adapter for public history querying with visibility and filter enforcement
- [x] 3.5 Add DI tokens and module wiring for the new history module

## 4. Additive integration with existing modules

- [x] 4.1 Extend general exchange-rate create flow to record a history snapshot after successful operational persistence
- [x] 4.2 Extend general exchange-rate update flow to record a history snapshot only when `rate` changes effectively
- [x] 4.3 Extend VIP exchange-rate create flow to record a history snapshot after successful operational persistence
- [x] 4.4 Extend VIP exchange-rate update flow to record a history snapshot only when `rate` changes effectively
- [x] 4.5 Ensure enable/disable-only flows do not record history in phase 1
- [x] 4.6 Wrap recorder invocation in non-blocking `try/catch` behavior and add safe internal failure logging

## 5. Public GraphQL contract

- [x] 5.1 Add GraphQL input type for `exchangeRateHistory` filters
- [x] 5.2 Add GraphQL output type exposing only safe public history fields
- [x] 5.3 Add public query `exchangeRateHistory` without auth guards
- [x] 5.4 Enforce `visibility = PUBLIC` and `currencyCode` ANY semantics in the query use-case
- [x] 5.5 Regenerate and verify `src/schema.gql`

## 6. Validation

- [x] 6.1 Add tests covering append-only snapshot insertion on create and rate change
- [x] 6.2 Add tests confirming no history row is added for enable/disable-only operations
- [x] 6.3 Add tests confirming recorder failures do not fail the main operational mutation
- [x] 6.4 Add tests for public query filters by pair, flexible currency, type, date range, and pagination
- [x] 6.5 Add tests confirming non-public rows are excluded from the public query
- [x] 6.6 Run `npm run build` and validate no existing exchange-rate or preview contracts regress