# Specs: remittance recipient snapshot and inline beneficiary create

## Contract changes

## New input: ManualBeneficiaryInput

```graphql
input ManualBeneficiaryInput {
  fullName: String!
  phone: String!
  country: String!
  addressLine1: String!
  documentNumber: String!
  email: String
  city: String
  addressLine2: String
  postalCode: String
  documentType: DocumentType
  relationship: BeneficiaryRelationship
  deliveryInstructions: String
}
```

## Update input: SubmitRemittanceV2Input

```graphql
input SubmitRemittanceV2Input {
  beneficiaryId: ID
  manualBeneficiary: ManualBeneficiaryInput
  paymentAmount: String!
  paymentCurrencyCode: String!
  receivingCurrencyCode: String
  receptionMethod: ReceptionMethod!
  destinationCupCardNumber: String
  originAccountHolder: SubmitRemittanceV2OriginAccountHolderInput!
  originAccount: SubmitRemittanceV2OriginAccountInput!
  deliveryLocation: SubmitRemittanceV2DeliveryLocationInput!
}
```

Validation rule (business):
- Exactly one must be provided: `beneficiaryId` XOR `manualBeneficiary`.

## New output: RemittanceRecipientType

```graphql
type RemittanceRecipientType {
  fullName: String!
  phone: String!
  country: String!
  addressLine1: String!
  documentNumber: String!
  email: String
  city: String
  addressLine2: String
  postalCode: String
  documentType: DocumentType
  relationship: BeneficiaryRelationship
  deliveryInstructions: String
}
```

## Update output: RemittanceType

```graphql
type RemittanceType {
  ...
  beneficiary: BeneficiaryType!
  recipient: RemittanceRecipientType!
  ...
}
```

Behavioral note:
- `beneficiary` remains for compatibility.
- `recipient` is the historical source of truth (snapshot) and must not change if Beneficiary changes later.

## submitRemittanceV2 behavior spec

### Case A: existing beneficiary selected
Input:
- `beneficiaryId` present
- `manualBeneficiary` absent

Expected:
- ownership validation passes,
- remittance linked to that `beneficiaryId`,
- `recipient` snapshot populated from selected beneficiary at creation time.

### Case B: manual beneficiary provided
Input:
- `beneficiaryId` absent
- `manualBeneficiary` present

Expected:
- backend creates Beneficiary owned by sender,
- remittance linked to created beneficiary,
- `recipient` snapshot populated from created beneficiary.

### Invalid cases
- both absent => validation error.
- both present => validation error.

## Backfill requirement

Migration must backfill recipient snapshot columns for all existing remittances from joined Beneficiary data, assert required snapshot values are non-null, then enforce NOT NULL on required columns.

## Example query response (historical-safe)

```graphql
query MyRemittance($id: ID!) {
  myRemittance(id: $id) {
    id
    beneficiary { id fullName }
    recipient {
      fullName
      phone
      country
      addressLine1
      documentNumber
    }
  }
}
```

`recipient` must remain stable across later edits to `beneficiary`.
