# RF-031: adminCreateUser Single Role Input - Specs

## Status

CLOSED - All acceptance criteria are fulfilled.

## Requirement

`adminCreateUser` must accept a single `role` for frontend usage, keep temporary backward compatibility with `roles`, and normalize internally to `roles[]` without changing Prisma, JWT, guards, or existing multi-role flows.

## Acceptance Criteria Results

### [x] AC-1: `adminCreateUser` accepts single `role`

Result: fulfilled.

Evidence:
- mutation with only `role` works
- user is created successfully
- input is normalized internally to `roles[]`
- generated `schema.gql` includes `role` in `AdminCreateUserInput`

---

### [x] AC-2: `adminCreateUser` keeps accepting `roles` for backward compatibility

Result: fulfilled.

Evidence:
- mutation with only `roles` works
- legacy compatibility is preserved
- generated `schema.gql` keeps `roles` in `AdminCreateUserInput`

---

### [x] AC-3: `role` is persisted internally as `roles[]`

Result: fulfilled.

Evidence:
- `role` is mapped to one-element array before persistence
- persistence continues with `roles[]`
- auth model continues with `roles[]`
- user output behavior remains unchanged

---

### [x] AC-4: request fails if both `role` and `roles` are provided

Result: fulfilled.

Evidence:
- request is rejected
- message returned:
  `Exactly one of role or roles must be provided`
- no user is created

---

### [x] AC-5: request fails if none is provided

Result: fulfilled.

Evidence:
- request without `role` and without `roles` is rejected
- message returned:
  `Exactly one of role or roles must be provided`
- no user is created

Additional invalid-case coverage (explicit):
- `roles: []` is rejected with the same message

---

### [x] AC-6: no Prisma schema changes

Result: fulfilled.

Evidence:
- Prisma schema unchanged
- no migration required
- `User.roles: Role[]` remains unchanged

---

### [x] AC-7: no JWT, guard, or `adminSetUserRoles` changes

Result: fulfilled.

Evidence:
- JWT behavior unchanged
- `RolesGuard` behavior unchanged
- `adminSetUserRoles` unchanged
- authorization behavior unchanged

---

### [x] AC-8: generated GraphQL contract includes both input fields

Result: fulfilled.

Evidence:
- `npm run build` OK
- `PORT=3001 npm run start:dev` OK
- `schema.gql` confirms:
  - `AdminCreateUserInput` contains `role`
  - `AdminCreateUserInput` keeps `roles`
  - `UserType.role` remains unchanged

## Functional validation coverage

Validated scenarios:

- `role` only -> OK
- `roles` only -> OK
- both -> expected validation error
- neither -> expected validation error
- `roles: []` -> expected validation error

## Regression check summary

No regressions found in related role flows:

- user output behavior remains correct
- login remains correct
- guards remain correct
- `adminSetUserRoles` remains correct
- authorization behavior remains unchanged

## Final spec closure statement

RF-031 is implemented, validated, backward compatible, and ready for merge.