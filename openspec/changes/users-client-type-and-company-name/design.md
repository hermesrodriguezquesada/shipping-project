# Design: users client type and company name

## Overview
This change introduces two business fields in the users domain while preserving the current architecture and contracts as much as possible:

- persistence: Prisma `User` model
- contract: GraphQL code-first `UserType` and related inputs
- behavior: user create/update flows and existing mappers/adapters

No auth/guard/RBAC behavior changes are included.

## Prisma changes

### 1) New enum
Add Prisma enum:
- `ClientType`
  - `PERSON`
  - `COMPANY`

### 2) User model changes
Add fields to `User`:
- `clientType ClientType`
- `companyName String?`

Intended final model:
- `clientType` required, with DB default `PERSON`
- `companyName` nullable

## Migration and backfill strategy
Deterministic, safe rollout sequence:

1. Create enum `ClientType`.
2. Add `User.clientType` as nullable temporarily.
3. Add `User.companyName` as nullable.
4. Backfill all existing users to `clientType=PERSON` where null.
5. Set `User.clientType` to NOT NULL.
6. Set DB default for `User.clientType` to `PERSON`.

Backfill policy:
- Existing users always become `PERSON`.
- `companyName` remains null.

This ensures deterministic data with zero ambiguity.

## GraphQL changes (code-first)

### User output
Extend `UserType` with:
- `clientType: ClientType!`
- `companyName: String`

Keep role output unchanged:
- `role: String!`

### Inputs to extend
Add optional fields to keep additive compatibility:

- `RegisterInput`
  - `clientType?: ClientType`
  - `companyName?: string`

- `UpdateMyProfileInput`
  - `clientType?: ClientType`
  - `companyName?: string`

- `AdminCreateUserInput`
  - `clientType?: ClientType`
  - `companyName?: string`

- `AdminUpdateUserProfileInput`
  - `clientType?: ClientType`
  - `companyName?: string`

No additional filters are introduced in `adminUsers`.

## Application changes

### register
- Extend `RegisterInputDto` and `RegisterUseCase` to carry `clientType` and `companyName`.
- Persist through existing user command flow.
- Default behavior remains backward-compatible when new fields are omitted.

### me / myProfile
- No query signature changes.
- Existing user fetch + mapper path now includes `clientType` and `companyName` in `UserType` output.

### updateMyProfile
- Extend DTO/input and use existing update profile command path.
- Apply client-type validation rules before write.

### adminCreateUser
- Extend input and use-case payload.
- Persist `clientType/companyName` through user command adapter.

### adminUpdateUserProfile
- Extend input and use-case payload.
- Support updating `clientType/companyName` with explicit validation.

### mapper and adapters
- Extend:
  - `UserEntity`
  - user ports (`UserCommandPort`, query mapping shape)
  - Prisma adapters (`create`, `updateProfile`, read mapping)
  - `UserMapper.toGraphQL`

This keeps the existing user/admin architecture intact.

## Validation rules (PERSON vs COMPANY)
Rules are explicit and shared across create/update flows:

1. Effective `clientType`:
   - if provided in input, use it
   - otherwise use existing value (for updates)
   - for create/register default to `PERSON` if omitted

2. If effective `clientType=COMPANY`:
   - `companyName` must be non-empty after trim

3. If effective `clientType=PERSON`:
   - `companyName` is stored as null
   - non-empty `companyName` should be rejected as invalid for PERSON

This prevents contradictory states and keeps data quality high.

## Out of scope
- No changes to auth/guards.
- No role model migration or role output format changes.
- No admin list filter expansion beyond existing role/isActive/isDeleted.
- No UI/frontend changes.
- No unrelated refactors in non-user modules.
