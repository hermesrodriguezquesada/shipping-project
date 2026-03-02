# Specs: pricing-commission-delivery-fees

## Preconditions
- Usuario autenticado para `pricingPreview` y wizard de remesas.
- Usuario ADMIN autenticado para operaciones `admin*` de reglas.
- Catálogos de moneda habilitados.
- Exchange rate habilitado para par `paymentCurrency -> receivingCurrency`.

## Headers
- `Authorization: Bearer <ACCESS_TOKEN>`
- `Content-Type: application/json`

## GraphQL operations

### Query
- `pricingPreview(input: PricingPreviewInput!): PricingPreviewType!`

### Admin Mutations / Queries
- `adminCreateCommissionRule`
- `adminUpdateCommissionRule`
- `adminSetCommissionRuleEnabled`
- `adminCommissionRules`
- `adminCreateDeliveryFeeRule`
- `adminUpdateDeliveryFeeRule`
- `adminSetDeliveryFeeRuleEnabled`
- `adminDeliveryFeeRules`

## Positive examples

### Pricing preview
```graphql
query PricingPreview($input: PricingPreviewInput!) {
  pricingPreview(input: $input) {
    commissionAmount
    commissionCurrencyCode
    commissionRuleId
    commissionRuleVersion
    deliveryFeeAmount
    deliveryFeeCurrencyCode
    deliveryFeeRuleId
    exchangeRateId
    exchangeRateRate
    netReceivingAmount
    netReceivingCurrencyCode
  }
}
```

```json
{
  "input": {
    "amount": "150",
    "paymentCurrencyCode": "USD",
    "receivingCurrencyCode": "CUP",
    "holderType": "PERSON",
    "country": "<COUNTRY>",
    "region": "<REGION>",
    "city": "<CITY>"
  }
}
```

### Submit snapshot expectation
Después de `submitRemittance(remittanceId: "<RID>")`, la remesa persiste snapshots:
- comisión (ruleId/version/amount/currency)
- delivery fee (ruleId opcional/amount/currency)
- netReceiving (amount/currency)
- FX snapshot (id/rate/usedAt)

## Negative cases
- No token: `Unauthorized`.
- No admin en `admin*`: `Forbidden`.
- `paymentCurrencyCode` no soportada (ej: `CUP`): error de validación `Commission only supports paymentCurrencyCode USD or EUR`.
- Regla deshabilitada/no disponible para comisión: error de validación.
- Sin FX habilitado para par: error de validación.

## Bloques por etapa (copy/paste)

### Wizard
- Crear draft: `createRemittanceDraftV2(input:{ beneficiaryId:"<BEN_ID>" })`
- Set amount / origen / holder / reception / receiving currency.

### PricingPreview
- Ejecutar `pricingPreview(input)` con placeholders:
  - `<COUNTRY>`, `<REGION>`, `<CITY>`

### Submit
- `submitRemittance(remittanceId:"<RID>")`
- Verificar snapshots inmutables en lectura de remesa.

### Paid
- `markRemittancePaid(remittanceId:"<RID>", paymentDetails:"...")`

### Confirm
- `adminConfirmRemittancePayment(remittanceId:"<RID>")`

### Delivered
- `adminMarkRemittanceDelivered(remittanceId:"<RID>")`

## Placeholders
- `<ACCESS_TOKEN>`
- `<BEN_ID>`
- `<RID>`
- `<COUNTRY>`
- `<REGION>`
- `<CITY>`
- `<RATE_ID>`
