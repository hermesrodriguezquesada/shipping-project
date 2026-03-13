# Specs: remittances legacy cleanup and field removal

## Breaking compatibility note
This change is intentionally breaking for GraphQL clients that still query:
- `destinationCupCardNumber`
- `exchangeRateRateUsed`

After rollout, those selections become invalid on `RemittanceType`.

## GraphQL removals from `RemittanceType`
Remove exactly:
- `destinationCupCardNumber`
- `exchangeRateRateUsed`

## Required remittance frontend contract after cleanup
Frontend must use:
- `owner`
- `destinationAccountNumber`
- `appliedExchangeRate`

## Preferred fields that remain in `RemittanceType`
```graphql
type RemittanceType {
  owner: UserType!
  destinationAccountNumber: String
  appliedExchangeRate: String
}
```

## Internal DB/schema cleanup status in this change
Reviewed internal fields:
- `exchangeRateIdUsed`
- `exchangeRateUsedAt`
- `originZelleEmail`
- `originIban`
- `originStripePaymentMethodId`
- `originAccountHolderType`
- `originAccountHolderFirstName`
- `originAccountHolderLastName`
- `originAccountHolderCompanyName`

Result for this change:
- No internal DB fields are removed because repository usage confirms they are still active in submit/read paths.
- Therefore, no Prisma schema removals are specified in this change.

## Before/after examples

### Before (legacy query still valid)
```graphql
query MyRemittanceBefore($id: ID!) {
  myRemittance(id: $id) {
    id
    destinationCupCardNumber
    exchangeRateRateUsed
    destinationAccountNumber
    appliedExchangeRate
  }
}
```

### After (new required contract)
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
  }
}
```

### Expected negative validation after cleanup
```graphql
query InvalidLegacyFields($id: ID!) {
  myRemittance(id: $id) {
    destinationCupCardNumber
    exchangeRateRateUsed
  }
}
```

Expected GraphQL validation failure:
- `Cannot query field "destinationCupCardNumber" on type "RemittanceType".`
- `Cannot query field "exchangeRateRateUsed" on type "RemittanceType".`
