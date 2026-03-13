# Specs: catalogs payment and reception method create and metadata

## GraphQL contract additions (code-first target)

### Enum addition
```graphql
enum PaymentMethodKind {
  PLATFORM
  MANUAL
}
```

### PaymentMethodType extension
```graphql
type PaymentMethodType {
  id: ID!
  code: String!
  name: String!
  description: String
  type: PaymentMethodKind!
  additionalData: String
  enabled: Boolean!
  imgUrl: String
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Input additions
```graphql
input AdminCreatePaymentMethodInput {
  code: String!
  name: String!
  description: String
  additionalData: String
  imgUrl: String
  enabled: Boolean
}

input AdminUpdatePaymentMethodAdditionalDataInput {
  code: String!
  additionalData: String
}

input AdminCreateReceptionMethodInput {
  code: String!
  name: String!
  currencyCode: String!
  method: ReceptionPayoutMethod!
  description: String
  imgUrl: String
  enabled: Boolean
}
```

### Mutation additions
```graphql
type Mutation {
  adminCreatePaymentMethod(input: AdminCreatePaymentMethodInput!): PaymentMethodType!
  adminUpdatePaymentMethodAdditionalData(input: AdminUpdatePaymentMethodAdditionalDataInput!): PaymentMethodType!
  adminCreateReceptionMethod(input: AdminCreateReceptionMethodInput!): ReceptionMethodType!
}
```

## Nullability rules
- `PaymentMethod.type`: non-null in DB and GraphQL output.
- `PaymentMethod.additionalData`: nullable in DB and GraphQL output.
- `AdminCreatePaymentMethodInput.additionalData`: optional.
- `AdminUpdatePaymentMethodAdditionalDataInput.additionalData`: nullable to allow explicit clearing.
- `AdminCreateReceptionMethodInput.description`: optional.
- `AdminCreateReceptionMethodInput.imgUrl`: optional.
- `AdminCreateReceptionMethodInput.enabled`: optional (defaults to `true`).

## Behavior rules

### adminCreatePaymentMethod
- Must always persist `type=MANUAL`.
- Input must not accept `type`.
- `enabled` defaults to `true` when omitted.
- `code` must be normalized and unique.

### adminUpdatePaymentMethodAdditionalData
- Must update only `additionalData` for the targeted payment method code.
- Must allow setting `additionalData=null` to clear value.
- Existing description flow remains independent.

### adminCreateReceptionMethod
- Requires valid existing currency (`currencyCode`).
- Requires valid `method` (`ReceptionPayoutMethod`).
- Must create with required fields (`code`, `name`, `currencyCode`, `method`) and optional metadata.
- `enabled` defaults to `true` when omitted.

## Backfill requirement
Existing `PaymentMethod` rows must be backfilled deterministically:
- `ZELLE`, `IBAN`, `STRIPE` -> `PLATFORM`
- Any other existing code -> `MANUAL` (explicit deterministic default)

## Before/after examples

### Before (current behavior)
- `paymentMethods` output does not include `type` or `additionalData`.
- `adminCreatePaymentMethod` does not exist.
- `adminCreateReceptionMethod` does not exist.
- Additional data cannot be edited.

### After (expected behavior)
```graphql
query PaymentMethodsWithMetadata {
  paymentMethods(enabledOnly: false) {
    code
    name
    type
    additionalData
    enabled
  }
}
```

```graphql
mutation CreatePaymentMethod {
  adminCreatePaymentMethod(
    input: {
      code: "BANK_TRANSFER"
      name: "Bank Transfer"
      description: "Manual bank transfer"
      additionalData: "requires transfer receipt"
      enabled: true
    }
  ) {
    code
    name
    type
    additionalData
    enabled
  }
}
```
Expected: `type` is always `MANUAL`.

```graphql
mutation UpdatePaymentMethodAdditionalData {
  adminUpdatePaymentMethodAdditionalData(
    input: {
      code: "BANK_TRANSFER"
      additionalData: "requires receipt and reference number"
    }
  ) {
    code
    additionalData
    type
  }
}
```

```graphql
mutation CreateReceptionMethod {
  adminCreateReceptionMethod(
    input: {
      code: "CUP_MOBILE_WALLET"
      name: "CUP Mobile Wallet"
      currencyCode: "CUP"
      method: TRANSFER
      description: "Mobile wallet payout"
      enabled: true
    }
  ) {
    code
    name
    currency { code }
    method
    enabled
  }
}
```
