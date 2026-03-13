# Tasks: users client type and company name

## Implementation checklist
- [x] 1) Update Prisma schema
  - add `ClientType` enum
  - add `User.clientType`
  - add `User.companyName`

- [x] 2) Create migration with deterministic backfill
  - existing users -> `clientType=PERSON`
  - `companyName` null

- [x] 3) Update user query/command adapters

- [x] 4) Update GraphQL `UserType` output

- [x] 5) Update register input/flow if this change includes registration support

- [x] 6) Update `updateMyProfile`

- [x] 7) Update `adminCreateUser`

- [x] 8) Update `adminUpdateUserProfile`

- [x] 9) Regenerate schema via:
  - `npm run build`
  - `PORT=3001 npm run start:dev`
  - verify `src/schema.gql`

- [x] 10) Smoke tests for:
  - `me/myProfile` return `clientType/companyName`
  - `adminCreateUser` persists `clientType/companyName`
  - `adminUpdateUserProfile` updates them
  - `updateMyProfile` updates them

## Constraints reminder
- Do not modify role handling.
- Do not add unrelated filters unless explicitly necessary.
- Keep additive compatibility where possible.
