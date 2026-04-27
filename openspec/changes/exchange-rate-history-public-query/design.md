## Context

Current state:

- `ExchangeRate` persists general exchange rates and resolves the active value by querying enabled rows.
- `VipExchangeRate` persists a single global VIP rate per currency pair and updates it in place.
- Existing public GraphQL exchange-rate queries are read-only and unauthenticated, while VIP management is protected.
- The system already uses isolated modules and ports/adapters per bounded context.

Constraints for this change:

- Historical records are immutable snapshots of rate value, not technical logs and not audit records.
- History generation MUST be automatic and MUST NOT be exposed as a manual mutation.
- History recording MUST be non-blocking so operational rate updates remain the source of truth if history persistence fails.
- The solution must remain additive and avoid redesigning `exchange-rates`, `vip-pricing`, or preview flows.

## Goals / Non-Goals

**Goals:**
- Add an append-only historical model for exchange-rate value snapshots.
- Support `GENERAL`, `VIP`, and future rate families through a generic domain model.
- Record history on create and on effective `rate` changes only.
- Expose a public GraphQL query `exchangeRateHistory` filtered by currency pair, flexible currency match, type, date range, and pagination.
- Ensure public output only includes entries marked `PUBLIC`.
- Integrate additively through an `ExchangeRateHistoryRecorderPort` from existing modules.

**Non-Goals:**
- Replacing or redesigning `ExchangeRate` or `VipExchangeRate` operational persistence.
- Recording enable/disable transitions in phase 1.
- Adding manual history mutations.
- Introducing a full audit trail with actor, IP, request metadata, or operational diagnostics.
- Replacing `pricingPreview` or `vipProfitPreview` with historical reads.
- Building analytics, charts, aggregations, alerts, or BI outputs in phase 1.

## Decisions

### 1. Use a separate append-only module and model

Decision:
- Create `src/modules/exchange-rate-history/` with a generic entity `ExchangeRateHistory`.

Rationale:
- Keeps historical concerns out of operational tables and avoids mixing read-history requirements with write-time rate management.
- Matches the repository's pattern of adding isolated modules for new capabilities instead of overloading existing slices.
- Allows a single query surface for `GENERAL`, `VIP`, and future rate types.

Alternatives considered:
- Embed history inside `ExchangeRate`: rejected because it would couple operational writes and historical reads to one module and does not fit VIP or future types.
- Separate tables per type: rejected for phase 1 because it duplicates schema, adapters, and GraphQL contracts without a strong requirement for storage separation.

### 2. Model history as immutable value snapshots

Decision:
- Each record stores a snapshot of one rate value at one moment in time and is never updated or deleted.

Suggested shape:

```txt
ExchangeRateHistory
- id
- rateType
- visibility
- sourceRateId?
- fromCurrencyId?
- toCurrencyId?
- fromCurrencyCode
- toCurrencyCode
- rate
- createdAt
```

Rationale:
- The requirement defines history as an append-only value timeline, not an audit stream.
- `sourceRateId` helps internal traceability without introducing foreign-key coupling to records that may evolve or be deleted.
- Snapshotting `fromCurrencyCode` and `toCurrencyCode` preserves historical meaning without forcing joins to current catalogs.

Alternatives considered:
- Store only ids and resolve codes through joins: rejected because it weakens historical preservation and complicates the public query.
- Add actor/request metadata: rejected because it turns the model into an audit log rather than a pure value-history model.

### 3. Restrict phase 1 recording to create and rate changes

Decision:
- Record history when a rate is created and when `rate` changes effectively.
- Do not record `enabled` toggles in phase 1.

Rationale:
- The business definition is evolution of the rate value over time.
- `enabled` is an operational state flag, not a value snapshot change.
- Avoids polluting the timeline with non-price events and keeps semantics clear for public consumers.

Alternatives considered:
- Record create, update, enable, and disable: rejected because it mixes value history with lifecycle/audit history.
- Record only updates and skip create: rejected because the initial value is part of the time series.

### 4. Integrate through a non-blocking recorder port

Decision:
- Add `ExchangeRateHistoryRecorderPort` and invoke it from `exchange-rates` and `vip-pricing` application use-cases after the operational write succeeds.
- Wrap recorder invocation in local `try/catch` so recorder failures do not fail the primary mutation.

Rationale:
- Preserves module boundaries and keeps the rule explicit in application orchestration.
- Satisfies the non-blocking requirement without introducing event buses, queues, or cross-module transactional coupling.
- Keeps operational persistence as the primary source of truth.

Alternatives considered:
- Emit asynchronous domain events: rejected for phase 1 because it increases infrastructure and observability complexity.
- Record inside Prisma adapters: rejected because it hides business rules in persistence code and makes selective recording harder to test.

### 5. Separate storage support from public visibility

Decision:
- Include `visibility` in the history model and expose only `PUBLIC` rows in the public query.

Rationale:
- The system must support `GENERAL`, `VIP`, and future types, but public exposure may differ by business policy.
- This keeps the design extensible without forcing VIP to become public by default.

Alternatives considered:
- Infer visibility directly from `rateType`: rejected because type and exposure policy are different concerns.
- Expose all history publicly: rejected because VIP and future specialized rates may be commercially sensitive.

### 6. Keep the public contract minimal and filter-driven

Decision:
- Expose `exchangeRateHistory(input)` publicly with filters:
  - `fromCurrencyCode`
  - `toCurrencyCode`
  - `currencyCode` matching either side (`ANY` semantics)
  - `rateTypes`
  - `dateFrom`
  - `dateTo`
  - `limit`
  - `offset`

Suggested output fields:
- `rateType`
- `fromCurrencyCode`
- `toCurrencyCode`
- `rate`
- `createdAt`

Rationale:
- Covers the requested query shape while keeping the public payload free of internal identifiers and operational metadata.
- `currencyCode` with implicit ANY semantics is the simplest phase 1 answer to “histórico por moneda”.

Alternatives considered:
- Add `currencySide` in phase 1: rejected as extra complexity unless frontend proves it necessary.
- Expose `sourceRateId` publicly: rejected as internal coupling with no value for public clients.

## Risks / Trade-offs

- [History write can fail silently relative to the main mutation] -> Mitigation: log recorder failures with rate type, pair, and source id; document non-blocking semantics explicitly.
- [PUBLIC/PRIVATE policy may remain ambiguous for VIP] -> Mitigation: default VIP to `PRIVATE` until product explicitly approves public exposure.
- [Future rate families may need extra fields] -> Mitigation: keep the initial model narrowly focused on exchange-rate snapshots and revisit only when a real future type appears.
- [Operational modules need small additive hooks despite “no modification” intent] -> Mitigation: constrain changes to application-layer integration points only; no redesign of operational contracts or schemas.

## Migration Plan

1. Add Prisma enum(s), append-only model, and indexes for history filtering.
2. Add the new module `exchange-rate-history` with domain ports, use-cases, GraphQL types, and Prisma adapters.
3. Wire `ExchangeRateHistoryRecorderPort` in DI.
4. Add additive calls from exchange-rate and VIP-rate write use-cases.
5. Add public GraphQL query and regenerate schema.
6. Validate that existing exchange-rate and preview flows remain unchanged.

Rollback:
- Remove module wiring and public query.
- Keep or drop the history table depending on migration strategy; no existing module depends on it for correctness.

## Open Questions

- Should any VIP history rows be marked `PUBLIC` in phase 1, or should public history remain `GENERAL` only at launch?
- Is `currencyCode` with implicit ANY semantics sufficient for frontend, or will product require an explicit side selector in a later phase?
- Does product want the public query ordered strictly by `createdAt desc`, or should a future phase support ascending time-series traversal for charts?