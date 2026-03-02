# Tasks: replace-user-roles-array-with-single-role-field

- [ ] Remove `roles` field from GraphQL output types that expose user roles.
- [ ] Add `role` field (`String!`) in the same GraphQL output types.
- [ ] Update GraphQL mapping/resolver layer to return `role = roles[0]`.
- [ ] Adjust GraphQL-facing DTOs/types/mappers if necessary to support `role` output shape.
- [ ] Keep Prisma schema unchanged.
- [ ] Keep authorization guards and role validation logic unchanged.
- [ ] Regenerate GraphQL schema and verify field replacement in `src/schema.gql`.

## Validation

- [ ] Run `npm run build`.
- [ ] Run `PORT=3001 npm run start:dev`.
- [ ] Verify generated `src/schema.gql` includes `role: String!` and no `roles` output field for `UserType`.

## Smoke tests

- [ ] `login` returns `user.role`.
- [ ] `me` returns `role`.
- [ ] `adminUsers` returns `role`.
- [ ] Confirm no runtime authorization regression.

## Guardrails

- [ ] No unrelated refactors.
- [ ] No database schema changes.
- [ ] No guard/authorization behavior changes.
- [ ] Change remains strictly scoped to GraphQL contract and mapping layer.
