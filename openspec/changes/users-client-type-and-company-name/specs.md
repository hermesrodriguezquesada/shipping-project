# Specs: users client type and company name

## GraphQL contract additions and updates (code-first target)

### Enum addition
```graphql
enum ClientType {
  PERSON
  COMPANY
}
```

### UserType extension
```graphql
type UserType {
  id: ID!
  email: String!
  role: String!
  isActive: Boolean!
  isDeleted: Boolean!

  firstName: String
  lastName: String
  phone: String
  birthDate: DateTime
  addressLine1: String
  addressLine2: String
  city: String
  country: String
  postalCode: String

  clientType: ClientType!
  companyName: String

  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Input updates
```graphql
input RegisterInput {
  email: String!
  password: String!
  clientType: ClientType
  companyName: String
}

input UpdateMyProfileInput {
  firstName: String
  lastName: String
  phone: String
  birthDate: DateTime
  addressLine1: String
  addressLine2: String
  city: String
  country: String
  postalCode: String
  clientType: ClientType
  companyName: String
}

input AdminCreateUserInput {
  email: String!
  password: String!
  roles: [Role!]
  firstName: String
  lastName: String
  phone: String
  birthDate: DateTime
  addressLine1: String
  addressLine2: String
  city: String
  country: String
  postalCode: String
  clientType: ClientType
  companyName: String
}

input AdminUpdateUserProfileInput {
  userId: ID!
  firstName: String
  lastName: String
  phone: String
  birthDate: DateTime
  addressLine1: String
  addressLine2: String
  city: String
  country: String
  postalCode: String
  clientType: ClientType
  companyName: String
}
```

## Nullability rules
- DB:
  - `User.clientType`: required after migration/backfill
  - `User.companyName`: nullable
- GraphQL output:
  - `UserType.clientType`: non-null
  - `UserType.companyName`: nullable
- GraphQL inputs:
  - new fields are optional for additive compatibility

## Behavior rules

### register
- If `clientType` is omitted, persist `PERSON`.
- If `clientType=COMPANY`, `companyName` is required and must be non-empty after trim.
- If `clientType=PERSON`, persist `companyName=null`; non-empty `companyName` is invalid.

### adminCreateUser
- Same rules as `register` for `clientType/companyName`.
- Role handling remains unchanged.

### updateMyProfile
- Supports updating `clientType` and `companyName`.
- Validation uses effective final state:
  - `COMPANY` requires non-empty `companyName`.
  - `PERSON` stores `companyName=null` and rejects non-empty company name.

### adminUpdateUserProfile
- Same behavior as `updateMyProfile`, scoped to target userId.
- No role changes in this flow.

### me / myProfile / adminUsers output
- Returned `UserType` must include `clientType` and `companyName`.
- Existing `role: String!` output remains unchanged.

## Backfill requirement
Existing users must be backfilled deterministically during migration:
- `clientType=PERSON`
- `companyName=null`

## Before/after examples

### Before
```graphql
query MeBefore {
  me {
    id
    email
    role
  }
}
```

### After
```graphql
query MeAfter {
  me {
    id
    email
    role
    clientType
    companyName
  }
}
```

```graphql
mutation RegisterCompanyUser {
  register(
    input: {
      email: "legal@example.com"
      password: "Passw0rd!"
      clientType: COMPANY
      companyName: "Acme Logistics LLC"
    }
  ) {
    accessToken
    user {
      email
      clientType
      companyName
      role
    }
  }
}
```

```graphql
mutation AdminCreatePersonUser {
  adminCreateUser(
    input: {
      email: "person@example.com"
      password: "Passw0rd!"
      clientType: PERSON
      firstName: "Ana"
      lastName: "Perez"
    }
  ) {
    email
    clientType
    companyName
    role
  }
}
```

```graphql
mutation UpdateProfileToCompany {
  updateMyProfile(
    input: {
      clientType: COMPANY
      companyName: "Perez Trading"
    }
  ) {
    id
    clientType
    companyName
  }
}
```
