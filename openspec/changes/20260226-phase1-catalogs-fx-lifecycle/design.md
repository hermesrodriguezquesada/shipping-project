## Overview

Se implementa una sola fase operacional sobre el dominio actual usando `Remittance` como order transaccional y `Transfer` como ejecución, incorporando catálogos dinámicos y tasas de cambio con snapshot.

La implementación sigue arquitectura existente y minimiza ruptura:

- Reuso de módulo `remittances`.
- Nuevos módulos de catálogo/FX solo si el wiring actual lo requiere; preferencia por extensión mínima en `remittances` + adapters Prisma.
- Mutations existentes se preservan; se agregan endpoints complementarios.

## Data Model (Prisma)

### 1) Catalogs

```prisma
model PaymentMethod {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  description String?
  enabled     Boolean  @default(true)
  imgUrl      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  remittances Remittance[]
}

model ReceptionMethodCatalog {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  description String?
  enabled     Boolean  @default(true)
  imgUrl      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  remittances Remittance[]
}

model CurrencyCatalog {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  description String?
  enabled     Boolean  @default(true)
  imgUrl      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 2) FX History

```prisma
model ExchangeRate {
  id               String   @id @default(uuid())
  fromCurrencyCode String
  toCurrencyCode   String
  rate             Decimal
  enabled          Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([fromCurrencyCode, toCurrencyCode, enabled, createdAt])
}
```

Regla de lectura: `exchangeRate(from,to)` devuelve la tasa `enabled=true` más reciente por `createdAt desc`.

### 3) Remittance extensions

Agregar campos en `Remittance`:

```prisma
paymentMethodId          String?
receptionMethodCatalogId String?
statusDescription        String?
paymentDetails           String?
exchangeRateIdUsed       String?
exchangeRateRateUsed     Decimal?
exchangeRateUsedAt       DateTime?
```

Relaciones:

- `paymentMethod   PaymentMethod? @relation(...)`
- `receptionMethodCatalog ReceptionMethodCatalog? @relation(...)`
- `exchangeRateUsed ExchangeRate? @relation(...)`

## Lifecycle Design

### RemittanceStatus target (fase 1)

- `DRAFT`
- `PENDING_PAYMENT`
- `PENDING_PAYMENT_CONFIRMATION`
- `PAID_SENDING_TO_RECEIVER`
- `SUCCESS`
- `PAYMENT_ERROR`
- `CANCELED_BY_CLIENT`
- `CANCELED_BY_ADMIN`

### Migration strategy (compatibilidad)

Al migrar enum existente:

- `SUBMITTED` -> `PENDING_PAYMENT`
- `COMPLETED` -> `SUCCESS`
- `CANCELLED` -> `CANCELED_BY_ADMIN`
- `DRAFT` permanece `DRAFT`

Notas:

- Backfill en migración SQL para datos existentes antes de eliminar valores legacy.
- `submitRemittance` mantiene firma y pasa a `DRAFT -> PENDING_PAYMENT`.

## API Design (GraphQL)

### Catalog queries

- `paymentMethods(enabledOnly: Boolean = true): [PaymentMethodType!]!`
- `receptionMethods(enabledOnly: Boolean = true): [ReceptionMethodType!]!`
- `currencies(enabledOnly: Boolean = true): [CurrencyType!]!`

### FX queries

- `exchangeRate(from: String!, to: String!): ExchangeRateType`
- `adminExchangeRates(from: String, to: String, limit: Int, offset: Int): [ExchangeRateType!]!` (opcional)

### Remittance admin queries

- `adminRemittances(limit: Int, offset: Int): [RemittanceType!]!`
- `adminRemittancesByUser(userId: ID!, limit: Int, offset: Int): [RemittanceType!]!`
- `adminRemittance(id: ID!): RemittanceType`

### Admin mutations

- `adminUpdatePaymentMethodDescription(code: String!, description: String): PaymentMethodType!`
- `adminSetPaymentMethodEnabled(code: String!, enabled: Boolean!): PaymentMethodType!`
- `adminUpdateReceptionMethodDescription(code: String!, description: String): ReceptionMethodType!`
- `adminSetReceptionMethodEnabled(code: String!, enabled: Boolean!): ReceptionMethodType!`
- `adminCreateCurrency(input): CurrencyType!`
- `adminUpdateCurrency(input): CurrencyType!`
- `adminSetCurrencyEnabled(code: String!, enabled: Boolean!): CurrencyType!`
- `adminCreateExchangeRate(input): ExchangeRateType!`
- `adminUpdateExchangeRate(input): ExchangeRateType!`
- `adminDeleteExchangeRate(id: ID!): Boolean!` (soft-delete recomendado: `enabled=false`)
- `adminConfirmRemittancePayment(remittanceId: ID!): Boolean!`
- `adminCancelRemittance(remittanceId: ID!, statusDescription: String!): Boolean!`
- `adminMarkRemittanceDelivered(remittanceId: ID!): Boolean!`

### Client mutations

- `markRemittancePaid(remittanceId: ID!, paymentDetails: String!): Boolean!`
- `cancelMyRemittance(remittanceId: ID!): Boolean!`

## Security

- Client ops: `GqlAuthGuard` + ownership `senderUserId`.
- Admin ops: `GqlAuthGuard` + `Roles(Role.ADMIN)` + `RolesGuard`.
- “Público” para tasa de cambio se implementa sin auth si arquitectura actual lo permite; fallback autenticado si el módulo GraphQL actual aplica guard global.

## Status Transition Rules

- `submitRemittance`: `DRAFT -> PENDING_PAYMENT`
- `markRemittancePaid` (CLIENT): `PENDING_PAYMENT -> PENDING_PAYMENT_CONFIRMATION`
- `adminConfirmRemittancePayment`: `PENDING_PAYMENT_CONFIRMATION -> PAID_SENDING_TO_RECEIVER`
- `cancelMyRemittance` (CLIENT): solo desde `PENDING_PAYMENT -> CANCELED_BY_CLIENT`
- `adminCancelRemittance`: desde estado no terminal permitido -> `CANCELED_BY_ADMIN` + `statusDescription`
- `adminMarkRemittanceDelivered`: `PAID_SENDING_TO_RECEIVER -> SUCCESS`

## Snapshot Rule

En el punto de congelamiento de tasa (submit o confirmación de pago, configurable en use case):

- persistir `exchangeRateIdUsed`, `exchangeRateRateUsed`, `exchangeRateUsedAt`.

Recomendación fase 1: snapshot en `submitRemittance` para fijar cotización al iniciar etapa de pago.