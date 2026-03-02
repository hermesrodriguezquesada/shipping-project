# QA Smoke GraphQL — backend contract v2 remittance cleanup

## Cómo usar esta guía

1. Abre `http://localhost:3001/graphql`.
2. Configura headers según cada bloque:

```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>"
}
```

3. Pega cada operación en el panel izquierdo.
4. Pega variables JSON en **Query Variables** cuando aplique.
5. Ejecuta en orden para respetar precondiciones.

---

## Placeholders

- `<ACCESS_TOKEN>`: token CLIENT.
- `<ADMIN_TOKEN>`: token ADMIN.
- `<BEN_ID>`: ID de beneficiario.
- `<RID>`: ID de remesa.

---

## 1) Register devuelve refreshToken

```graphql
mutation RegisterClient {
  register(input: { email: "qa.client.v2@example.com", password: "Passw0rd!" }) {
    accessToken
    refreshToken
    sessionId
    user {
      id
      email
    }
  }
}
```

Esperado:
- `refreshToken` presente y no vacío.

---

## 2) Crear beneficiario (CLIENT)

Header:

```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>"
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

Guardа `id` como `<BEN_ID>`.

---

## 3) Wizardless submit (CLIENT)

Header:

```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>"
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

Esperado:
- `status = PENDING_PAYMENT`.
- `paymentAmount`, `receivingAmount` y `feesBreakdownJson` presentes.

Guarda `id` como `<RID>`.

---

## 4) Marcar pago (CLIENT)

Header:

```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>"
}
```

```graphql
mutation MarkPaid {
  markRemittancePaid(remittanceId: "<RID>", paymentDetails: "zelle_ref_qa")
}
```

Esperado:
- `true`.

---

## 5) Confirmar pago (ADMIN)

Header:

```json
{
  "Authorization": "Bearer <ADMIN_TOKEN>"
}
```

```graphql
mutation AdminConfirm {
  adminConfirmRemittancePayment(remittanceId: "<RID>")
}
```

Esperado:
- `true`.

---

## 6) Marcar entregada (ADMIN)

Header:

```json
{
  "Authorization": "Bearer <ADMIN_TOKEN>"
}
```

```graphql
mutation AdminDelivered {
  adminMarkRemittanceDelivered(remittanceId: "<RID>")
}
```

Esperado:
- `true`.

---

## Negativos

### A) Sin token

```graphql
mutation SubmitWithoutToken($input: SubmitRemittanceV2Input!) {
  submitRemittanceV2(input: $input) {
    id
  }
}
```

Esperado:
- error de autenticación.

### B) receivingCurrency disabled/no válida

```graphql
mutation SubmitDisabledCurrency($input: SubmitRemittanceV2Input!) {
  submitRemittanceV2(input: $input) {
    id
  }
}
```

Variables (override):

```json
{
  "input": {
    "beneficiaryId": "<BEN_ID>",
    "paymentAmount": "150",
    "paymentCurrencyCode": "USD",
    "receivingCurrencyCode": "XYZ",
    "receptionMethod": "CUP_CASH",
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
      "country": "CU"
    },
    "paymentMethodCode": "ZELLE"
  }
}
```

Esperado:
- `receivingCurrencyCode is not enabled`.

### C) CUP_TRANSFER sin destinationCupCardNumber

```graphql
mutation SubmitMissingCupCard($input: SubmitRemittanceV2Input!) {
  submitRemittanceV2(input: $input) {
    id
  }
}
```

Variables (override):

```json
{
  "input": {
    "beneficiaryId": "<BEN_ID>",
    "paymentAmount": "150",
    "paymentCurrencyCode": "USD",
    "receivingCurrencyCode": "CUP",
    "receptionMethod": "CUP_TRANSFER",
    "destinationCupCardNumber": null,
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
      "country": "CU"
    },
    "paymentMethodCode": "ZELLE"
  }
}
```

Esperado:
- `destinationCupCardNumber is required for CUP_TRANSFER`.

### D) ZELLE sin zelleEmail

```graphql
mutation SubmitMissingZelleEmail($input: SubmitRemittanceV2Input!) {
  submitRemittanceV2(input: $input) {
    id
  }
}
```

Variables (override):

```json
{
  "input": {
    "beneficiaryId": "<BEN_ID>",
    "paymentAmount": "150",
    "paymentCurrencyCode": "USD",
    "receivingCurrencyCode": "CUP",
    "receptionMethod": "CUP_CASH",
    "originAccountHolder": {
      "holderType": "PERSON",
      "firstName": "Alex",
      "lastName": "Doe"
    },
    "originAccount": {
      "originAccountType": "ZELLE",
      "zelleEmail": null
    },
    "deliveryLocation": {
      "country": "CU"
    },
    "paymentMethodCode": "ZELLE"
  }
}
```

Esperado:
- `zelleEmail is required for ZELLE`.
