# Specs: backend contract V2 remittance cleanup

## Operations

### Mutation: submitRemittanceV2
`submitRemittanceV2(input: SubmitRemittanceV2Input!): RemittanceType!`

Behavior:
- Creates a remittance directly in `PENDING_PAYMENT` (no draft required).
- Validates required fields by channel and account type.
- Calculates and persists immutable pricing snapshots:
  - exchange rate id/rate/time
  - commission rule/version/amount
  - delivery fee rule/amount
  - net receiving amount
  - `feesBreakdownJson`
- Returns full remittance shape including catalog relations required by frontend:
  - `paymentMethod`
  - `paymentCurrency`
  - `receivingCurrency`
  - `receptionMethod`
  - `beneficiary`

Validation errors:
- `destinationCupCardNumber is required for CUP_TRANSFER`
- `zelleEmail is required for ZELLE`
- `receivingCurrencyCode is not enabled`
- `paymentMethodCode must match originAccount.originAccountType`
- amount out-of-range errors using configured min/max

### Mutation: register
`register(input: RegisterInput!): AuthPayload!`

Behavior:
- Returns complete `AuthPayload` including `refreshToken` and `sessionId`.
- Same refresh/logout compatibility as login flow.

## GraphQL shape cleanup (`RemittanceType`)

Preferred fields:
- `paymentAmount`
- `receivingAmount`
- `paymentMethod`
- `paymentCurrency`
- `receptionMethod`
- `feesBreakdownJson`

Deprecated compatibility fields:
- `amount` -> use `paymentAmount`
- `currency` -> use `paymentCurrency`
- `paymentMethodCode` -> use `paymentMethod.code`
- `receptionMethodCatalog` and `receptionMethodCode` -> use `receptionMethod`

Removed from GraphQL:
- `transfer`
- `exchangeRateUsedAt`

## QA copy/paste flows

### CLIENT + ADMIN happy path (single-submit wizardless)

```graphql
mutation RegisterClient {
  register(input: { email: "qa.client.v2@example.com", password: "Passw0rd!" }) {
    accessToken
    refreshToken
    sessionId
    user { id email }
  }
}
```

```graphql
mutation CreateBeneficiary($input: CreateBeneficiaryInput!) {
  createBeneficiary(input: $input) {
    id
    fullName
  }
}
```

Variables:
```json
{
  "input": {
    "fullName": "QA Beneficiary",
    "phone": "+5350000000",
    "email": "beneficiary.qa@example.com",
    "country": "CU",
    "city": "Havana",
    "addressLine1": "Calle 1",
    "documentType": "ID_CARD",
    "documentNumber": "B12345678",
    "relationship": "FAMILY"
  }
}
```

```graphql
mutation SubmitRemittanceV2($input: SubmitRemittanceV2Input!) {
  submitRemittanceV2(input: $input) {
    id
    status
    paymentAmount
    receivingAmount
    feesBreakdownJson
    paymentMethod { code name }
    paymentCurrency { code name }
    receivingCurrency { code name }
    receptionMethod { code name }
    beneficiary { id fullName }
  }
}
```

Variables:
```json
{
  "input": {
    "beneficiaryId": "<BEN_ID>",
    "paymentAmount": "150",
    "paymentCurrencyCode": "USD",
    "receivingCurrencyCode": "CUP",
    "receptionMethod": "CUP_TRANSFER",
    "destinationCupCardNumber": "9200000000000000",
    "originAccountHolder": {
      "holderType": "PERSON",
      "firstName": "Alex",
      "lastName": "Doe"
    },
    "originAccount": {
      "originAccountType": "ZELLE",
      "zelleEmail": "alex@example.com"
    },
    "deliveryLocation": {
      "country": "CU",
      "region": "La Habana",
      "city": "Havana"
    },
    "paymentMethodCode": "ZELLE"
  }
}
```

```graphql
mutation MarkPaid {
  markRemittancePaid(remittanceId: "<RID>", paymentDetails: "zelle_ref_qa")
}
```

```graphql
mutation AdminConfirm {
  adminConfirmRemittancePayment(remittanceId: "<RID>")
}
```

```graphql
mutation AdminDelivered {
  adminMarkRemittanceDelivered(remittanceId: "<RID>")
}
```

### Negative QA cases

```graphql
mutation SubmitWithoutToken($input: SubmitRemittanceV2Input!) {
  submitRemittanceV2(input: $input) { id }
}
```
Expect: auth error (missing/invalid bearer).

```graphql
mutation SubmitDisabledCurrency($input: SubmitRemittanceV2Input!) {
  submitRemittanceV2(input: $input) { id }
}
```
Variables override:
```json
{ "input": { "receivingCurrencyCode": "XYZ" } }
```
Expect: `receivingCurrencyCode is not enabled`.

```graphql
mutation SubmitMissingCupCard($input: SubmitRemittanceV2Input!) {
  submitRemittanceV2(input: $input) { id }
}
```
Variables override:
```json
{ "input": { "receptionMethod": "CUP_TRANSFER", "destinationCupCardNumber": null } }
```
Expect: `destinationCupCardNumber is required for CUP_TRANSFER`.

```graphql
mutation SubmitMissingZelleEmail($input: SubmitRemittanceV2Input!) {
  submitRemittanceV2(input: $input) { id }
}
```
Variables override:
```json
{
  "input": {
    "originAccount": { "originAccountType": "ZELLE", "zelleEmail": null }
  }
}
```
Expect: `zelleEmail is required for ZELLE`.

## Auth/logout QA

```graphql
mutation RegisterReturnsRefreshToken {
  register(input: { email: "qa.register.refresh@example.com", password: "Passw0rd!" }) {
    accessToken
    refreshToken
    sessionId
  }
}
```

```graphql
mutation LogoutWithRefreshToken {
  logout(input: { refreshToken: "<ACCESS_TOKEN>" })
}
```
Use token placeholder from register/login result (`<ACCESS_TOKEN>` placeholder required by QA template).
