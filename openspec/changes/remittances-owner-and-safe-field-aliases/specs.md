# Specs: remittances owner and safe field aliases

## GraphQL contract additions (code-first target)

### RemittanceType additions
```graphql
type RemittanceType {
  owner: UserType!
  destinationAccountNumber: String
  appliedExchangeRate: String
}
```

### Existing fields retained (no removal in this change)
```graphql
type RemittanceType {
  destinationCupCardNumber: String
  exchangeRateRateUsed: String
  originZelleEmail: String
  originIban: String
  originStripePaymentMethodId: String
  originAccountHolderType: OriginAccountHolderType
  originAccountHolderFirstName: String
  originAccountHolderLastName: String
  originAccountHolderCompanyName: String
}
```

## Nullability rules
- `owner`: non-null (`UserType!`) due required sender relation in remittance persistence model and controlled read includes.
- `destinationAccountNumber`: nullable, mirrors `destinationCupCardNumber` nullability.
- `appliedExchangeRate`: nullable, mirrors `exchangeRateRateUsed` nullability.

## Behavioral mapping rules
- `owner` maps from remittance sender relation.
- `destinationAccountNumber` equals `destinationCupCardNumber`.
- `appliedExchangeRate` equals `exchangeRateRateUsed`.
- Legacy fields remain unchanged and continue to be populated.

## Before/after examples

### Before
```graphql
query MyRemittanceBefore($id: ID!) {
  myRemittance(id: $id) {
    id
    destinationCupCardNumber
    exchangeRateRateUsed
  }
}
```

### After (recommended)
```graphql
query MyRemittanceAfter($id: ID!) {
  myRemittance(id: $id) {
    id
    owner {
      id
      email
      role
    }
    destinationAccountNumber
    appliedExchangeRate

    # still available during migration
    destinationCupCardNumber
    exchangeRateRateUsed
  }
}
```

### Admin list/read after
```graphql
query AdminRemittancesAfter {
  adminRemittances(limit: 20, offset: 0) {
    id
    owner { id email role }
    destinationAccountNumber
    appliedExchangeRate
    destinationCupCardNumber
    exchangeRateRateUsed
  }
}
```

## Compatibility note
- This change is additive and backward-compatible.
- Existing GraphQL remittance fields remain available during frontend migration.

## Frontend migration recommendation
Frontend should progressively adopt:
- `owner`
- `destinationAccountNumber`
- `appliedExchangeRate`

Legacy field usage should be phased out in a future cleanup change after adoption is complete.
