## Specifications Context

- Remittance + Transfer ya modelan transacciones (order/execute) en el repo.
- El wizard y read API básicos ya existen en GraphQL.
- Fase 1 exige endpoints de catálogos, FX y lifecycle operativo sin romper firmas existentes.

## New Specifications

### A) Payment methods

#### Query

- `paymentMethods(enabledOnly: Boolean = true): [PaymentMethodType!]!`

#### Admin Mutations

- `adminUpdatePaymentMethodDescription(code: String!, description: String): PaymentMethodType!`
- `adminSetPaymentMethodEnabled(code: String!, enabled: Boolean!): PaymentMethodType!`

#### Rules

- `code` único y estable.
- `enabledOnly=true` retorna solo activos.
- operaciones admin requieren rol `ADMIN`.

---

### B) Reception methods

#### Query

- `receptionMethods(enabledOnly: Boolean = true): [ReceptionMethodType!]!`

#### Admin Mutations

- `adminUpdateReceptionMethodDescription(code: String!, description: String): ReceptionMethodType!`
- `adminSetReceptionMethodEnabled(code: String!, enabled: Boolean!): ReceptionMethodType!`

#### Rules

- Catálogo dinámico en BD independiente del enum legacy del wizard.
- Mantener compatibilidad temporal: mapping controlado entre catálogo y selección existente.

---

### C) Currencies

#### Query

- `currencies(enabledOnly: Boolean = true): [CurrencyType!]!`

#### Admin Mutations

- `adminCreateCurrency(input): CurrencyType!`
- `adminUpdateCurrency(input): CurrencyType!`
- `adminSetCurrencyEnabled(code: String!, enabled: Boolean!): CurrencyType!`

#### Rules

- `code` único (`USD`, `EUR`, etc.).
- desactivar moneda no borra historial.

---

### D) Exchange rates

#### Queries

- `exchangeRate(from: String!, to: String!): ExchangeRateType`
- `adminExchangeRates(from: String, to: String, limit: Int, offset: Int): [ExchangeRateType!]!` (opcional)

#### Admin Mutations

- `adminCreateExchangeRate(input): ExchangeRateType!`
- `adminUpdateExchangeRate(input): ExchangeRateType!`
- `adminDeleteExchangeRate(id: ID!): Boolean!`

#### Rules

- Mantener histórico: no sobrescritura destructiva sin control.
- `exchangeRate(from,to)` devuelve registro `enabled=true` más reciente.
- `delete` recomendado como desactivación (`enabled=false`) para conservar historial.

---

### E) Transactions mapped to Remittance + Transfer

#### Admin Queries

- `adminRemittances(limit: Int, offset: Int): [RemittanceType!]!`
- `adminRemittancesByUser(userId: ID!, limit: Int, offset: Int): [RemittanceType!]!`
- `adminRemittance(id: ID!): RemittanceType`

#### Client Mutations

- `markRemittancePaid(remittanceId: ID!, paymentDetails: String!): Boolean!`
- `cancelMyRemittance(remittanceId: ID!): Boolean!`

#### Admin Mutations

- `adminConfirmRemittancePayment(remittanceId: ID!): Boolean!`
- `adminCancelRemittance(remittanceId: ID!, statusDescription: String!): Boolean!`
- `adminMarkRemittanceDelivered(remittanceId: ID!): Boolean!`

#### Transition Rules

- `submitRemittance`: `DRAFT -> PENDING_PAYMENT`
- `markRemittancePaid`: `PENDING_PAYMENT -> PENDING_PAYMENT_CONFIRMATION`
- `adminConfirmRemittancePayment`: `PENDING_PAYMENT_CONFIRMATION -> PAID_SENDING_TO_RECEIVER`
- `cancelMyRemittance`: `PENDING_PAYMENT -> CANCELED_BY_CLIENT`
- `adminCancelRemittance`: `*allowed* -> CANCELED_BY_ADMIN` + descripción
- `adminMarkRemittanceDelivered`: `PAID_SENDING_TO_RECEIVER -> SUCCESS`

#### Snapshot Rules

- persistir en remesa: `exchangeRateIdUsed`, `exchangeRateRateUsed`, `exchangeRateUsedAt`.

---

## Prisma Migration Specification

### New tables

- `PaymentMethod`
- `ReceptionMethodCatalog`
- `CurrencyCatalog`
- `ExchangeRate`

### Remittance changes

- agregar referencias a catálogos/métodos de pago.
- agregar `statusDescription`, `paymentDetails`.
- agregar snapshot FX.

### RemittanceStatus migration

- ampliar/reemplazar enum con estados fase 1.
- mapping de datos legacy:
  - `SUBMITTED` -> `PENDING_PAYMENT`
  - `COMPLETED` -> `SUCCESS`
  - `CANCELLED` -> `CANCELED_BY_ADMIN`

## GraphQL Examples

### payment methods

```graphql
query {
  paymentMethods(enabledOnly: true) {
    code
    name
    description
    enabled
  }
}
```

```graphql
mutation {
  adminSetPaymentMethodEnabled(code: "ZELLE", enabled: false) {
    code
    enabled
  }
}
```

### reception methods

```graphql
query {
  receptionMethods(enabledOnly: true) {
    code
    name
    enabled
  }
}
```

```graphql
mutation {
  adminUpdateReceptionMethodDescription(code: "CUP_TRANSFER", description: "Transferencia a tarjeta CUP") {
    code
    description
  }
}
```

### currencies

```graphql
mutation {
  adminCreateCurrency(input: { code: "GBP", name: "Libra esterlina", description: "Pound sterling" }) {
    code
    name
    enabled
  }
}
```

```graphql
query {
  currencies(enabledOnly: true) {
    code
    name
  }
}
```

### exchange rates

```graphql
mutation {
  adminCreateExchangeRate(input: { from: "USD", to: "CUP", rate: "330.25" }) {
    id
    fromCurrencyCode
    toCurrencyCode
    rate
    createdAt
  }
}
```

```graphql
query {
  exchangeRate(from: "USD", to: "CUP") {
    rate
    createdAt
  }
}
```

### transaction lifecycle

```graphql
mutation {
  markRemittancePaid(remittanceId: "c6ecb326-56df-4a19-a74f-c619f0a2cf50", paymentDetails: "Zelle ref #123456")
}
```

```graphql
mutation {
  adminConfirmRemittancePayment(remittanceId: "c6ecb326-56df-4a19-a74f-c619f0a2cf50")
}
```

```graphql
mutation {
  adminMarkRemittanceDelivered(remittanceId: "c6ecb326-56df-4a19-a74f-c619f0a2cf50")
}
```

```graphql
query {
  adminRemittances(limit: 20, offset: 0) {
    id
    status
    amount
    paymentDetails
    statusDescription
    exchangeRateRateUsed
  }
}
```