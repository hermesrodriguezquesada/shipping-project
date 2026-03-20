# RF-031: adminCreateUser Single Role Input - Design

## Status

CLOSED - Design implemented as approved.

## Design compliance summary

The implementation fully respected the approved RF-031 design with no functional deviations.

Implemented exactly as designed:

- `AdminCreateUserInput` expanded with `role?: Role`
- `roles?: Role[]` preserved for temporary backward compatibility
- XOR runtime validation enforced between `role` and `roles`
- strict rejection for ambiguous or empty payloads
- normalization path preserved to internal `roles[]`

## Validation rule compliance

Implemented runtime rule:

- valid: only `role`
- valid: only `roles` with one or more elements
- invalid: both `role` and `roles`
- invalid: none
- invalid: `roles: []`

Implemented validation message:

- `Exactly one of role or roles must be provided`

## Internal model status

The internal multi-role model remains active and accepted:

- persistence continues with `roles[]`
- auth token payload continues with `roles[]`
- authorization checks continue against `roles[]`
- multi-role mutation `adminSetUserRoles` remains unchanged

This confirms that RF-031 simplified input for frontend without changing domain and security internals.

## No-deviation statement

No design deviations were introduced.

No out-of-scope changes were introduced.

No additional deprecation workflow was introduced.

## GraphQL contract validation

Code-first validation was executed and confirmed:

- build OK
- runtime startup OK
- generated schema confirms:
  - `AdminCreateUserInput` contains `role` and preserves `roles`
  - `UserType.role` remains unchanged

## Non-impact confirmation

Confirmed unchanged:

- Prisma schema
- JWT behavior
- `RolesGuard`
- `adminSetUserRoles`
- `UserMapper` output behavior

RF-031 is design-complete and ready for merge.