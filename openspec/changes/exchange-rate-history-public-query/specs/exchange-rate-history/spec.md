## ADDED Requirements

### Requirement: System records immutable exchange-rate history snapshots automatically
The system MUST persist append-only `ExchangeRateHistory` snapshots automatically from operational rate flows and MUST NOT expose any manual API to create, update, or delete historical records.

#### Scenario: General rate creation persists initial snapshot
- **WHEN** an operational flow creates a new `ExchangeRate`
- **THEN** the system MUST insert exactly one `ExchangeRateHistory` record containing the created rate value and currency snapshot data

#### Scenario: VIP rate creation persists initial snapshot
- **WHEN** an operational flow creates a new `VipExchangeRate`
- **THEN** the system MUST insert exactly one `ExchangeRateHistory` record containing the created rate value and currency snapshot data

#### Scenario: No manual history mutation surface exists
- **WHEN** a client inspects the GraphQL contract for exchange-rate history
- **THEN** the system MUST NOT expose any mutation or manual command for creating, updating, or deleting history rows

### Requirement: Exchange-rate history is append-only and preserves value snapshots
The system MUST model `ExchangeRateHistory` as immutable value snapshots that are never updated or deleted after insertion.

#### Scenario: Historical rows remain immutable
- **WHEN** an `ExchangeRateHistory` row has been persisted
- **THEN** subsequent rate operations MUST preserve that row unchanged and add new rows instead of mutating prior history

#### Scenario: Snapshot preserves currency codes
- **WHEN** an `ExchangeRateHistory` row is inserted
- **THEN** it MUST store `fromCurrencyCode` and `toCurrencyCode` as snapshot fields together with the recorded `rate`

### Requirement: History captures only create and effective rate changes in phase 1
The system MUST append a new history snapshot on create and on effective `rate` changes only, and MUST NOT append rows for enable/disable-only changes in phase 1.

#### Scenario: Rate change appends a new snapshot
- **WHEN** an operational flow changes the `rate` value of an existing general or VIP exchange rate
- **THEN** the system MUST insert a new `ExchangeRateHistory` row with the new rate value

#### Scenario: No-op rate update does not append history
- **WHEN** an operational flow completes without changing the effective `rate` value
- **THEN** the system MUST NOT insert a new `ExchangeRateHistory` row

#### Scenario: Enable toggle does not append history
- **WHEN** an operational flow changes only `enabled` for an exchange rate in phase 1
- **THEN** the system MUST NOT insert a new `ExchangeRateHistory` row

### Requirement: History supports type and visibility policy
Each `ExchangeRateHistory` snapshot MUST include a rate type and visibility policy so that the storage model can support `GENERAL`, `VIP`, and future rate families while controlling public exposure.

#### Scenario: General history row records type and visibility
- **WHEN** the system persists a general exchange-rate history snapshot
- **THEN** the row MUST include `rateType = GENERAL` and a visibility value used for query filtering

#### Scenario: VIP history row records type and visibility
- **WHEN** the system persists a VIP exchange-rate history snapshot
- **THEN** the row MUST include `rateType = VIP` and a visibility value used for query filtering

### Requirement: History recording is non-blocking for operational mutations
The system MUST treat history persistence as best-effort so that a failure recording `ExchangeRateHistory` does not fail or roll back the primary operational rate mutation.

#### Scenario: General rate mutation succeeds even if history write fails
- **WHEN** a general exchange-rate create or rate update succeeds but the history recorder fails afterward
- **THEN** the primary mutation MUST still complete successfully

#### Scenario: VIP rate mutation succeeds even if history write fails
- **WHEN** a VIP exchange-rate create or rate update succeeds but the history recorder fails afterward
- **THEN** the primary mutation MUST still complete successfully

### Requirement: Public exchange-rate history query is unauthenticated and filtered
The system MUST expose a public GraphQL query `exchangeRateHistory` with filters for `fromCurrencyCode`, `toCurrencyCode`, `currencyCode`, `rateTypes`, `dateFrom`, `dateTo`, `limit`, and `offset`.

#### Scenario: Public client filters by exact currency pair
- **WHEN** a client executes `exchangeRateHistory` with `fromCurrencyCode` and `toCurrencyCode`
- **THEN** the system MUST return only history rows matching that pair within the requested filter range

#### Scenario: Public client filters by flexible currency code
- **WHEN** a client executes `exchangeRateHistory` with `currencyCode`
- **THEN** the system MUST return rows where the code matches either `fromCurrencyCode` or `toCurrencyCode`

#### Scenario: Public client filters by type and date range
- **WHEN** a client executes `exchangeRateHistory` with `rateTypes`, `dateFrom`, or `dateTo`
- **THEN** the system MUST apply those filters to the history query result

#### Scenario: Public query remains paginated
- **WHEN** a client executes `exchangeRateHistory` with `limit` and `offset`
- **THEN** the system MUST apply bounded pagination to the result set

### Requirement: Public exchange-rate history exposes only safe public data
The public `exchangeRateHistory` query MUST return only history rows with `visibility = PUBLIC` and MUST NOT expose internal identifiers or sensitive operational metadata.

#### Scenario: Private rows are excluded from public history
- **WHEN** a client executes the public `exchangeRateHistory` query
- **THEN** the system MUST exclude all rows whose visibility is not `PUBLIC`

#### Scenario: Public payload omits internal identifiers
- **WHEN** a client receives `exchangeRateHistory` results
- **THEN** the payload MUST NOT include `sourceRateId`, internal currency ids, actor metadata, or request-level technical details

#### Scenario: Public payload includes only safe history fields
- **WHEN** the system returns an `exchangeRateHistory` item
- **THEN** the item MUST include only safe public fields needed for history consumption, including type, currency codes, rate, and timestamp

### Requirement: Existing operational and preview flows remain unchanged
The change MUST be additive and MUST NOT alter the functional behavior or contract of existing operational exchange-rate and preview flows.

#### Scenario: Existing general exchange-rate queries remain unchanged
- **WHEN** existing public or admin exchange-rate queries continue to operate after the change
- **THEN** they MUST preserve their existing contract and semantics

#### Scenario: Existing preview flows remain unchanged
- **WHEN** `pricingPreview` or `vipProfitPreview` execute after the change
- **THEN** they MUST preserve their existing contract and data source semantics and MUST NOT depend on `ExchangeRateHistory`