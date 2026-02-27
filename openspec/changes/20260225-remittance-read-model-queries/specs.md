## Specifications Context

- Prisma ya contiene `Remittance` y `Transfer`.
- GraphQL actual expone mutations de escritura del wizard, pero no queries de lectura de remittances.
- UI requiere leer estado actual de la remesa para reflejar progreso.

## New Specifications

### Read model: RemittanceType

El sistema debe exponer `RemittanceType` con los siguientes campos:

- `id: ID!`
- `status: RemittanceStatus!`
- `amount: String!`
- `currency: Currency!`
- `originAccountType: OriginAccountType`
- `originZelleEmail: String`
- `originIban: String`
- `originStripePaymentMethodId: String`
- `receptionMethod: ReceptionMethod`
- `destinationCupCardNumber: String`
- `originAccountHolderType: OriginAccountHolderType`
- `originAccountHolderFirstName: String`
- `originAccountHolderLastName: String`
- `originAccountHolderCompanyName: String`
- `beneficiary: BeneficiaryType!`
- `transfer: TransferType`
- `createdAt: DateTime!`
- `updatedAt: DateTime!`

### Read model: TransferType

El sistema debe exponer `TransferType` con:

- `status: TransferStatus!`
- `providerRef: String`
- `failureReason: String`
- `createdAt: DateTime!`
- `updatedAt: DateTime!`

### Query: myRemittance

- Firma: `myRemittance(id: ID!): RemittanceType`
- Debe requerir autenticación (`GqlAuthGuard`).
- Debe validar ownership por `senderUserId`.
- Si no existe o no pertenece al usuario, retorna `null`.

### Query: myRemittances

- Firma: `myRemittances(limit: Int, offset: Int): [RemittanceType!]!`
- Debe requerir autenticación (`GqlAuthGuard`).
- Debe listar solo remittances del usuario (`senderUserId`).
- Debe soportar `limit/offset` opcionales.

## Non-regression Requirement

- No modificar firmas de mutations existentes del módulo remittances.

## GraphQL Examples

### válido — detalle propio

```graphql
query {
  myRemittance(id: "9d2d6f5e-3a11-4eb2-a11d-e2601e5f2a01") {
    id
    status
    amount
    currency
    receptionMethod
    destinationCupCardNumber
    originAccountType
    originAccountHolderType
    beneficiary {
      id
      fullName
    }
    transfer {
      status
      providerRef
    }
    updatedAt
  }
}
```

### válido — listado propio

```graphql
query {
  myRemittances(limit: 10, offset: 0) {
    id
    status
    amount
    currency
    createdAt
  }
}
```

### válido — id no propio o inexistente

```graphql
query {
  myRemittance(id: "00000000-0000-0000-0000-000000000000") {
    id
  }
}
```

Resultado esperado: `myRemittance: null`.

### inválido — sin auth

```graphql
query {
  myRemittances {
    id
  }
}
```

Resultado esperado: error de autorización por `GqlAuthGuard`.