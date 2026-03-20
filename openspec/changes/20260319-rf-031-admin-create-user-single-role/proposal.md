# RF-031: adminCreateUser Single Role Input - Proposal

## Status

CLOSED - Implemented and validated.

## Final result

RF-031 is resolved. `adminCreateUser` now accepts a single `role` for frontend usage while preserving temporary backward compatibility with `roles`, and internal persistence remains normalized to `roles[]`.

## Evidence summary

- `AdminCreateUserInput` accepts both:
  - `role?: Role`
  - `roles?: Role[]` (temporary compatibility)
- Runtime XOR validation is active and enforced:
  - valid: only `role`
  - valid: only `roles` with items
  - invalid: both
  - invalid: none
  - invalid: `roles: []`
- Unified validation message is active:
  - `Exactly one of role or roles must be provided`
- Internal normalization is active:
  - `role -> [role]`
  - `roles -> roles[]`
- Persistence and auth model remain unchanged:
  - Prisma schema unchanged
  - JWT payload unchanged
  - `RolesGuard` unchanged
  - `adminSetUserRoles` unchanged
  - `UserMapper` behavior unchanged
  - `UserType.role` unchanged

## GraphQL code-first validation executed

- `npm run build` completed OK
- `PORT=3001 npm run start:dev` completed OK
- `schema.gql` verified:
  - `AdminCreateUserInput` contains `role` and keeps `roles`
  - `UserType.role` remains unchanged

## Compatibility conclusion

The hybrid contract is accepted as final for this change:

- simplified frontend contract with `role`
- preserved internal multi-role model based on `roles[]`

## RF-032 decision

No additional change is required at this time.

RF-032 is not necessary right now based on implementation and validation results for RF-031.