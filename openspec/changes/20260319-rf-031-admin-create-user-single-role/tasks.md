# RF-031: adminCreateUser Single Role Input - Tasks

## Status

CLOSED - All tasks completed with no scope deviation.

## 1. Update `AdminCreateUserInput`

File: `src/modules/users/presentation/graphql/inputs/admin-create-user.input.ts`

- [x] Add `role?: Role`
- [x] Keep `roles?: Role[]`
- [x] Keep `roles` documented as temporary compatibility field
- [x] Keep contract backward compatible

---

## 2. Update resolver `admin-users.resolver.ts`

File: `src/modules/users/presentation/graphql/resolvers/admin-users.resolver.ts`

- [x] Pass `role` to use case
- [x] Keep passing `roles`
- [x] Keep mutation name and general signature unchanged

---

## 3. Update `AdminCreateUserUseCase`

File: `src/modules/users/application/use-cases/admin/admin-create-user.usecase.ts`

- [x] Add `role?: Role` to use-case input
- [x] Implement XOR validation
- [x] Enforce unique validation message:
  - `Exactly one of role or roles must be provided`
- [x] Normalize `role -> roles[]`
- [x] Keep command port call with `roles[]`
- [x] Cover invalid empty list case (`roles: []`)

---

## 4. Keep persistence and auth unchanged

- [x] Confirm `User.roles: Role[]` unchanged
- [x] Confirm JWT unchanged
- [x] Confirm `RolesGuard` unchanged
- [x] Confirm `adminSetUserRoles` unchanged
- [x] Confirm `UserMapper` unchanged

---

## 5. Build validation

- [x] Run `npm run build`
- [x] Confirm successful compilation

---

## 6. Runtime GraphQL validation

- [x] Run `PORT=3001 npm run start:dev`
- [x] Confirm successful startup
- [x] Validate generated `src/schema.gql`

---

## 7. Generated contract validation

- [x] Confirm `AdminCreateUserInput` contains `role`
- [x] Confirm `AdminCreateUserInput` keeps `roles`
- [x] Confirm `UserType.role` remains unchanged

---

## 8. Compatibility smoke tests

- [x] Test with only `role`
- [x] Test with only `roles`
- [x] Test with both fields
- [x] Test with neither field
- [x] Test with `roles: []`

---

## 9. Scope guardrails

- [x] Confirm no Prisma changes
- [x] Confirm no JWT changes
- [x] Confirm no `RolesGuard` changes
- [x] Confirm no `adminSetUserRoles` changes
- [x] Confirm no `UserMapper` changes
- [x] Confirm no out-of-scope refactors

## Final closure confirmation

RF-031 was completed exactly within approved scope.

No design changes were introduced.

No additional change was opened.

The change is documented as implemented, validated, backward compatible, and ready for merge.