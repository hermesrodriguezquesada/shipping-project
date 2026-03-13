# Specs: beneficiaries document duplicates and exchange-rate hard delete rules

## Contract note
GraphQL operation/type/input shapes remain unchanged for this change.

The update is behavioral:
- persistence constraints,
- create/delete command semantics,
- create-time validation.

## Beneficiary behavior specs

### createBeneficiary
After removing Prisma uniqueness on `(ownerUserId, documentNumber)`:
- creating multiple beneficiaries for the same owner with identical `documentNumber` is allowed.
- existing field validations and ownership context remain unchanged.

### updateBeneficiary
After removing the same uniqueness restriction:
- updating beneficiary `documentNumber` to a value already used by another beneficiary of the same owner is allowed.
- existing ownership/not-found behavior remains unchanged.

## Exchange-rate behavior specs

### adminCreateExchangeRate
Rule:
- If an active exchange rate already exists for the same normalized `from + to` pair, creating another active row for that pair must fail with validation error.

Allowed case:
- If only disabled historical rows exist for that pair, creating a new active row is allowed.

Clarifications:
- pair matching uses normalized uppercase currency codes in current flow.
- duplicate-active validation applies when requested create is active (`enabled=true` or omitted default).

### adminDeleteExchangeRate
Rule:
- Deletion is physical (row is removed from table), not a soft-disable.

Observable effect:
- deleted rate no longer appears in admin list/public list/latest queries.

## Before/after examples

### Beneficiary duplicates
Before:
- second beneficiary with same owner + same `documentNumber` failed due to DB unique constraint.

After:
```graphql
mutation CreateBeneficiaryA {
  createBeneficiary(
    input: {
      fullName: "John One"
      phone: "+5350000001"
      country: "CU"
      addressLine1: "Street 1"
      documentNumber: "ABC123"
    }
  ) {
    id
    documentNumber
  }
}
```

```graphql
mutation CreateBeneficiaryB {
  createBeneficiary(
    input: {
      fullName: "John Two"
      phone: "+5350000002"
      country: "CU"
      addressLine1: "Street 2"
      documentNumber: "ABC123"
    }
  ) {
    id
    documentNumber
  }
}
```
Expected: both succeed for same owner.

### Exchange-rate active duplicate rule
Before:
- creating another active row for same pair was allowed.

After:
```graphql
mutation CreateUsdCupActiveA {
  adminCreateExchangeRate(input: { from: "USD", to: "CUP", rate: "360" }) {
    id
    enabled
    fromCurrency { code }
    toCurrency { code }
  }
}
```

```graphql
mutation CreateUsdCupActiveB {
  adminCreateExchangeRate(input: { from: "USD", to: "CUP", rate: "365" }) {
    id
  }
}
```
Expected: second mutation fails validation while first active row exists.

Allowed after disabling prior active row:
```graphql
mutation DisableExistingRate {
  adminUpdateExchangeRate(input: { id: "existing-rate-id", rate: "360", enabled: false }) {
    id
    enabled
  }
}
```

```graphql
mutation CreateUsdCupActiveAfterDisable {
  adminCreateExchangeRate(input: { from: "USD", to: "CUP", rate: "365", enabled: true }) {
    id
    enabled
  }
}
```
Expected: create succeeds when no active duplicate remains.

### Exchange-rate hard delete
Before:
- delete operation effectively set `enabled=false`.

After:
```graphql
mutation DeleteExchangeRate {
  adminDeleteExchangeRate(id: "rate-id")
}
```
Expected: returns `true` and target row is physically removed.
