# QA Smoke GraphQL por módulo (Playground)

## Cómo usar esta guía en Playground
1. Abre `http://localhost:3001/graphql`.
2. En **HTTP HEADERS** pega:
```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>"
}
```
3. Para cada bloque, pega el `query`/`mutation` en el panel izquierdo.
4. Pega el JSON de variables en **QUERY VARIABLES** (panel inferior).
5. Ejecuta en el orden sugerido para evitar errores de precondición.

Sugerencia práctica: usa una pestaña por módulo (`Auth`, `Catalogs`, `FX`, `Commission`, `Delivery`, `Pricing`, `Remittances`).

Usar estos placeholders:
- `<ACCESS_TOKEN>`
- `<BEN_ID>`
- `<RID>`
- `<COUNTRY>`
- `<REGION>`
- `<CITY>`

Headers HTTP (Playground):
- `Authorization: Bearer <ACCESS_TOKEN>`
- `Content-Type: application/json`

---

## 0) Auth (token)

Nota Playground: para `login`, quita temporalmente el header `Authorization` si tu guard lo exige sin token inicial.

### Login
```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    refreshToken
    sessionId
    user { id email roles }
  }
}
```

```json
{
  "input": {
    "email": "admin@example.com",
    "password": "Admin123!"
  }
}
```

---

## 1) Catalogs module

### Payment methods
```graphql
query PaymentMethods {
  paymentMethods(enabledOnly: true) {
    id
    code
    name
    enabled
  }
}
```

### Reception methods
```graphql
query ReceptionMethods {
  receptionMethods(enabledOnly: true) {
    id
    code
    name
    enabled
  }
}
```

### Currencies
```graphql
query Currencies {
  currencies(enabledOnly: true) {
    id
    code
    name
    enabled
  }
}
```

---

## 2) Exchange Rates module

### Public latest rate
```graphql
query LatestRate {
  exchangeRate(from: "USD", to: "CUP") {
    id
    rate
    enabled
    fromCurrency { code }
    toCurrency { code }
  }
}
```

### Admin list
```graphql
query AdminRates {
  adminExchangeRates(from: "USD", to: "CUP", limit: 20, offset: 0) {
    id
    rate
    enabled
    createdAt
  }
}
```

---

## 3) Commission Rules module (admin)

### Create
```graphql
mutation CreateCommissionRule($input: AdminCreateCommissionRuleInput!) {
  adminCreateCommissionRule(input: $input) {
    id
    version
    enabled
    holderType
    thresholdAmount
    percentRate
    flatFee
    currency { code }
  }
}
```

```json
{
  "input": {
    "currencyCode": "USD",
    "holderType": "PERSON",
    "thresholdAmount": "100",
    "percentRate": "0.05",
    "flatFee": "5",
    "enabled": true
  }
}
```

### List
```graphql
query ListCommissionRules {
  adminCommissionRules(currencyCode: "USD", holderType: PERSON, enabled: true) {
    id
    version
    enabled
    thresholdAmount
    percentRate
    flatFee
    currency { code }
  }
}
```

### Update (new version)
```graphql
mutation UpdateCommissionRule($input: AdminUpdateCommissionRuleInput!) {
  adminUpdateCommissionRule(input: $input) {
    id
    version
    enabled
    thresholdAmount
    percentRate
    flatFee
  }
}
```

```json
{
  "input": {
    "id": "<COMMISSION_RULE_ID>",
    "flatFee": "6",
    "enabled": true
  }
}
```

### Enable/Disable
```graphql
mutation SetCommissionRuleEnabled {
  adminSetCommissionRuleEnabled(id: "<COMMISSION_RULE_ID>", enabled: false) {
    id
    enabled
    version
  }
}
```

---

## 4) Delivery Fees module (admin)

### Create
```graphql
mutation CreateDeliveryFeeRule($input: AdminCreateDeliveryFeeRuleInput!) {
  adminCreateDeliveryFeeRule(input: $input) {
    id
    enabled
    amount
    country
    region
    city
    currency { code }
  }
}
```

```json
{
  "input": {
    "currencyCode": "USD",
    "country": "<COUNTRY>",
    "region": "<REGION>",
    "city": "<CITY>",
    "amount": "2.50",
    "enabled": true
  }
}
```

### List
```graphql
query ListDeliveryFeeRules {
  adminDeliveryFeeRules(currencyCode: "USD", country: "<COUNTRY>", enabled: true) {
    id
    enabled
    amount
    country
    region
    city
    currency { code }
  }
}
```

### Update
```graphql
mutation UpdateDeliveryFeeRule($input: AdminUpdateDeliveryFeeRuleInput!) {
  adminUpdateDeliveryFeeRule(input: $input) {
    id
    enabled
    amount
    country
    region
    city
  }
}
```

```json
{
  "input": {
    "id": "<DELIVERY_FEE_RULE_ID>",
    "amount": "3.00",
    "enabled": true
  }
}
```

### Enable/Disable
```graphql
mutation SetDeliveryFeeRuleEnabled {
  adminSetDeliveryFeeRuleEnabled(id: "<DELIVERY_FEE_RULE_ID>", enabled: false) {
    id
    enabled
    amount
  }
}
```

---

## 5) Pricing module (preview)

### pricingPreview
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

### Negativo: currency no soportada para comisión
```json
{
  "input": {
    "amount": "150",
    "paymentCurrencyCode": "CUP",
    "receivingCurrencyCode": "USD",
    "holderType": "PERSON",
    "country": "<COUNTRY>"
  }
}
```
Esperado: error de validación `Commission only supports paymentCurrencyCode USD or EUR`.

---

## 6) Remittances module (wizard + submit + lifecycle)

### Create draft v2
```graphql
mutation CreateDraft($input: CreateRemittanceDraftInput!) {
  createRemittanceDraftV2(input: $input) {
    id
    status
    amount
    paymentCurrency { code }
  }
}
```

```json
{
  "input": {
    "beneficiaryId": "<BEN_ID>"
  }
}
```

### Set amount
```graphql
mutation SetAmount($input: SetRemittanceAmountInput!) {
  setRemittanceAmount(input: $input)
}
```

```json
{
  "input": {
    "remittanceId": "<RID>",
    "amount": "150"
  }
}
```

### Set origin account
```graphql
mutation SetOrigin($input: SetRemittanceOriginAccountInput!) {
  setRemittanceOriginAccount(input: $input)
}
```

```json
{
  "input": {
    "remittanceId": "<RID>",
    "originAccountType": "ZELLE",
    "zelleEmail": "payer@example.com"
  }
}
```

### Set origin account holder
```graphql
mutation SetHolder($input: SetRemittanceOriginAccountHolderInput!) {
  setRemittanceOriginAccountHolder(input: $input)
}
```

```json
{
  "input": {
    "remittanceId": "<RID>",
    "holderType": "PERSON",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Set reception method
```graphql
mutation SetReception($input: SetRemittanceReceptionMethodInput!) {
  setRemittanceReceptionMethod(input: $input)
}
```

```json
{
  "input": {
    "remittanceId": "<RID>",
    "receptionMethod": "CUP_CASH"
  }
}
```

### Set receiving currency
```graphql
mutation SetReceivingCurrency($input: SetRemittanceReceivingCurrencyInput!) {
  setRemittanceReceivingCurrency(input: $input)
}
```

```json
{
  "input": {
    "remittanceId": "<RID>",
    "currencyCode": "CUP"
  }
}
```

### Submit
```graphql
mutation Submit {
  submitRemittance(remittanceId: "<RID>")
}
```

### Read remittance
```graphql
query MyRemittance {
  myRemittance(id: "<RID>") {
    id
    status
    amount
    exchangeRateRateUsed
    exchangeRateUsedAt
    paymentCurrency { code }
    receivingCurrency { code }
  }
}
```

### Mark paid (client)
```graphql
mutation MarkPaid {
  markRemittancePaid(remittanceId: "<RID>", paymentDetails: "Bank transfer ref")
}
```

### Confirm paid (admin)
```graphql
mutation ConfirmPaid {
  adminConfirmRemittancePayment(remittanceId: "<RID>")
}
```

### Delivered (admin)
```graphql
mutation Delivered {
  adminMarkRemittanceDelivered(remittanceId: "<RID>")
}
```

---

## 7) Smoke mínimo E2E recomendado
1. Login admin/client y obtener token.
2. Verificar `currencies`, `paymentMethods`, `receptionMethods`.
3. Verificar `exchangeRate(USD,CUP)`.
4. Crear/listar regla comisión y regla delivery fee.
5. Ejecutar `pricingPreview` (positivo y negativo).
6. Ejecutar wizard + `submitRemittance`.
7. Ejecutar `markRemittancePaid` -> `adminConfirmRemittancePayment` -> `adminMarkRemittanceDelivered`.

---

## 8) Happy path (10 operaciones / ~5 minutos)

Objetivo: validar rápido que `pricingPreview` y submit con snapshots funcionan sin revisar todo el catálogo.

### Operación 1: Login
```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    user { id roles }
  }
}
```

### Operación 2: Verificar tasa FX
```graphql
query Rate {
  exchangeRate(from: "USD", to: "CUP") {
    id
    rate
  }
}
```

### Operación 3: Crear draft
```graphql
mutation Draft($input: CreateRemittanceDraftInput!) {
  createRemittanceDraftV2(input: $input) {
    id
    status
  }
}
```

Variables:
```json
{ "input": { "beneficiaryId": "<BEN_ID>" } }
```

### Operación 4: Set amount
```graphql
mutation Amount($input: SetRemittanceAmountInput!) {
  setRemittanceAmount(input: $input)
}
```

Variables:
```json
{ "input": { "remittanceId": "<RID>", "amount": "150" } }
```

### Operación 5: Set origin account (ZELLE)
```graphql
mutation Origin($input: SetRemittanceOriginAccountInput!) {
  setRemittanceOriginAccount(input: $input)
}
```

Variables:
```json
{
  "input": {
    "remittanceId": "<RID>",
    "originAccountType": "ZELLE",
    "zelleEmail": "payer@example.com"
  }
}
```

### Operación 6: Set holder
```graphql
mutation Holder($input: SetRemittanceOriginAccountHolderInput!) {
  setRemittanceOriginAccountHolder(input: $input)
}
```

Variables:
```json
{
  "input": {
    "remittanceId": "<RID>",
    "holderType": "PERSON",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Operación 7: Set reception method
```graphql
mutation Reception($input: SetRemittanceReceptionMethodInput!) {
  setRemittanceReceptionMethod(input: $input)
}
```

Variables:
```json
{ "input": { "remittanceId": "<RID>", "receptionMethod": "CUP_CASH" } }
```

### Operación 8: Set receiving currency
```graphql
mutation Receiving($input: SetRemittanceReceivingCurrencyInput!) {
  setRemittanceReceivingCurrency(input: $input)
}
```

Variables:
```json
{ "input": { "remittanceId": "<RID>", "currencyCode": "CUP" } }
```

### Operación 9: pricingPreview
```graphql
query Preview($input: PricingPreviewInput!) {
  pricingPreview(input: $input) {
    commissionAmount
    deliveryFeeAmount
    exchangeRateRate
    netReceivingAmount
    commissionRuleId
    deliveryFeeRuleId
  }
}
```

Variables:
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

### Operación 10: Submit + lectura final
```graphql
mutation Submit {
  submitRemittance(remittanceId: "<RID>")
}
```

Luego consulta:
```graphql
query Final {
  myRemittance(id: "<RID>") {
    id
    status
    exchangeRateRateUsed
    exchangeRateUsedAt
    amount
  }
}
```

Resultado esperado rápido:
- `pricingPreview` responde breakdown completo.
- `submitRemittance` retorna `true`.
- `myRemittance.status` pasa de `DRAFT` a `PENDING_PAYMENT`.
