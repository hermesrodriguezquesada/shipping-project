## Design

### 1) DIP fino en remittances

Nuevos puertos internos:

- `PaymentMethodAvailabilityPort`
- `ReceptionMethodAvailabilityPort`
- `CurrencyAvailabilityPort`
- `ExchangeRateSnapshotPort`

Responsabilidad:

- expresar necesidades de negocio de remittances sin exponer contratos amplios de catálogos/FX.

### 2) Bridge adapters en remittances

Implementaciones en `remittances/infrastructure/adapters`:

- `PaymentMethodAvailabilityBridgeAdapter`
- `ReceptionMethodAvailabilityBridgeAdapter`
- `CurrencyAvailabilityBridgeAdapter`
- `ExchangeRateSnapshotBridgeAdapter`

Comportamiento:

- inyectan puertos grandes por token (`CATALOGS_QUERY_PORT`, `EXCHANGE_RATES_QUERY_PORT`)
- delegan consultas
- filtran por `enabled` cuando aplica
- devuelven modelos mínimos para use-cases

### 3) Use-cases actualizados

Use-cases de remittances que consumen puertos pequeños:

- `set-remittance-origin-account.usecase.ts`
- `set-remittance-reception-method.usecase.ts`
- `set-remittance-receiving-currency.usecase.ts`
- `submit-remittance.usecase.ts`

### 4) Wiring

- `tokens.ts` agrega tokens internos de disponibilidad/snapshot.
- `RemittancesModule` registra bridge adapters y los expone por token interno.
- `CatalogsModule` y `ExchangeRatesModule` siguen exportando sus puertos grandes.

### 5) Contrato GraphQL

No cambia naming ni firma de operaciones.

Operaciones se mantienen distribuidas por resolver:

- catálogos en `catalogs.resolver.ts`
- tasas en `exchange-rates.resolver.ts`
- wizard/lifecycle/read en `remittances.resolver.ts`
