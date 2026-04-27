# Design: vip-exchange-rates-and-profit-preview

## Overview

Se introduce un módulo aislado `vip-pricing` con dos superficies:

- Administración de tasas VIP globales por par de moneda.
- Preview puro de ganancia VIP.

El módulo no participa en el ciclo de vida de remesas, no calcula pricing real y no reutiliza ni modifica `ExchangeRate`.

## Domain model

### VipExchangeRate

Modelo propio y global por par de moneda, sin `userId`:

```txt
VipExchangeRate
- id
- fromCurrencyId
- toCurrencyId
- rate
- enabled
- createdAt
- updatedAt
```

Restricciones de diseño:

- Cada par `fromCurrencyId + toCurrencyId` es único.
- `rate` representa la tasa VIP global del par.
- `baseRate` se lee desde `ExchangeRate` solo para preview y no se almacena en persistencia.
- No se almacenan previews ni ganancias calculadas.

## Why baseRate comes from ExchangeRate read-only

La fórmula requerida es:

```txt
vipProfitAmount = paymentAmount * (vipRate - baseRate)
```

Para cumplir las reglas del change:

- `vipRate` se obtiene desde `VipExchangeRate`.
- `baseRate` se obtiene leyendo `ExchangeRate` en modo read-only.

Esta decisión conserva el aislamiento requerido:

- no modifica `ExchangeRate`
- delegar cálculo a `pricingPreview`

## Business rules

### Configuración global

- Solo un administrador o empleado puede crear, actualizar y habilitar o deshabilitar tasas VIP.
- Las tasas se definen por par `fromCurrency -> toCurrency`.
- No se permiten duplicados para el mismo par de moneda.

### Preview de ganancia

- Solo un actor autenticado con `isVip = true` puede consultar el preview.
- El cálculo es puro y determinista.
- El cálculo usa exactamente `rateDifference = vipRate - baseRate` y `vipProfitAmount = paymentAmount * rateDifference`.
- Si `rateDifference <= 0`, entonces `vipProfitAmount = 0`.
- El resultado se devuelve en la respuesta y no se persiste.
- La consulta no dispara eventos, colas, mutaciones de estado ni llamadas a otros módulos de negocio.

## Module structure

El slice `vip-pricing` define sus propios componentes:

- `VipPricingResolver`
- `AdminCreateVipExchangeRateUseCase`
- `AdminUpdateVipExchangeRateUseCase`
- `AdminSetVipExchangeRateEnabledUseCase`
- `AdminListVipExchangeRatesUseCase`
- `PreviewVipProfitUseCase`
- `VipExchangeRateCommandPort`
- `VipExchangeRateQueryPort`
- adapters Prisma propios para `VipExchangeRate`
- DTOs GraphQL propios
- mapper propio del módulo

No se extienden entidades ni puertos de módulos existentes.

## GraphQL contract

El contrato funcional debe cubrir las siguientes operaciones.

### Admin mutations

```graphql
input AdminCreateVipExchangeRateInput {
  fromCurrencyCode: String!
  toCurrencyCode: String!
  rate: String!
  enabled: Boolean
}

input AdminUpdateVipExchangeRateInput {
  id: ID!
  rate: String
  enabled: Boolean
}

type VipExchangeRate {
  id: ID!
  fromCurrency: CurrencyType!
  toCurrency: CurrencyType!
  rate: String!
  enabled: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Mutation {
  adminCreateVipExchangeRate(input: AdminCreateVipExchangeRateInput!): VipExchangeRate!
  adminUpdateVipExchangeRate(input: AdminUpdateVipExchangeRateInput!): VipExchangeRate!
  adminSetVipExchangeRateEnabled(id: ID!, enabled: Boolean!): VipExchangeRate!
}
```

### Queries

```graphql
input AdminVipExchangeRatesInput {
  fromCurrencyCode: String
  toCurrencyCode: String
  enabled: Boolean
  limit: Int
  offset: Int
}

input VipProfitPreviewInput {
  paymentAmount: String!
  fromCurrencyCode: String!
  toCurrencyCode: String!
}

type VipProfitPreview {
  paymentAmount: String!
  fromCurrencyCode: String!
  toCurrencyCode: String!
  baseRate: String!
  vipRate: String!
  rateDifference: String!
  vipProfitAmount: String!
  profitCurrencyCode: String!
}

type Query {
  adminVipExchangeRates(input: AdminVipExchangeRatesInput): [VipExchangeRate!]!
  vipProfitPreview(input: VipProfitPreviewInput!): VipProfitPreview!
}
```

## Calculation semantics

Entradas:

- `paymentAmount`
- `fromCurrencyCode`
- `toCurrencyCode`
- `baseRate` leido de `ExchangeRate`
- `vipRate` leido de `VipExchangeRate`

Salida:

- `rateDifference`
- `vipProfitAmount`
- `profitCurrencyCode`

Regla exacta:

```txt
rateDifference = vipRate - baseRate
vipProfitAmount = paymentAmount * rateDifference
```

Si `rateDifference <= 0`, el preview devuelve `vipProfitAmount = 0` para evitar ganancias negativas.

## Validation rules

- `paymentAmount` debe ser numérico y mayor que `0`.
- `fromCurrencyCode` y `toCurrencyCode` deben resolver una tasa general enabled en `ExchangeRate`.
- `fromCurrencyCode` y `toCurrencyCode` deben resolver una tasa VIP enabled en `VipExchangeRate`.
- Si no existe una tasa VIP habilitada para el par, el preview falla con error de dominio explícito.
- Si no existe una tasa general habilitada para el par, el preview falla con error de dominio explícito.

## Persistence scope

Se persisten solo las configuraciones `VipExchangeRate` por par de moneda.

No se persiste:

- previews ejecutados
- ganancias calculadas
- histórico de cálculos
- relación por usuario

## Isolation guarantees

La implementación de este change debe respetar estas garantías:

- No importar casos de uso de `remittances`.
- No importar `pricingPreview` ni reutilizar sus DTOs.
- Solo leer `ExchangeRate`; nunca escribirlo ni reemplazarlo.
- No ampliar entidades compartidas existentes para incorporar lógica VIP de este módulo.
- No emitir eventos ni side-effects al calcular preview.

## Open questions resolved in this design

- Las tasas VIP son globales por par de moneda: no existe `userId` ni configuración por usuario.
- El preview no es pricing real: es una operación informativa y aislada.
- La condición VIP del caller se valida leyendo `User.isVip` sin modificar usuarios.