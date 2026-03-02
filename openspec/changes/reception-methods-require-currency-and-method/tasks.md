# Tasks: reception-methods-require-currency-and-method

1. Update Prisma schema
- [ ] Add enum `ReceptionPayoutMethod { CASH, TRANSFER }`.
- [ ] Add `currencyId` (NOT NULL) to `ReceptionMethodCatalog`.
- [ ] Add `method` (NOT NULL) to `ReceptionMethodCatalog`.
- [ ] Add relation `ReceptionMethodCatalog.currency -> CurrencyCatalog`.

2. Create migration with deterministic backfill
- [ ] Generate migration SQL adding nullable columns first.
- [ ] Backfill with explicit mapping `code -> {currencyCode, method}`.
- [ ] Add explicit failure if any existing code is unmapped.
- [ ] Enforce `NOT NULL` and FK/index after successful backfill.

3. Update catalogs Prisma adapters/query models
- [ ] Extend catalogs query port/read models for reception methods with `currency` and `method`.
- [ ] Update Prisma catalogs query adapter to join `CurrencyCatalog` and map `method`.

4. Update GraphQL types/resolvers/mappers
- [ ] Add GraphQL enum `ReceptionPayoutMethod` (code-first).
- [ ] Add `currency: CurrencyType!` in reception method output type.
- [ ] Add `method: ReceptionPayoutMethod!` in reception method output type.
- [ ] Update presentation mapper/resolver outputs accordingly.

5. Update remittance submit use-case
- [ ] In `submitRemittanceV2`, infer receiving currency from selected reception method.
- [ ] If client omits receiving currency input, auto-set inferred value.
- [ ] If client sends mismatched receiving currency, throw validation error.
- [ ] Keep all other remittance business rules unchanged.

6. Regenerate and verify GraphQL schema
- [ ] Run `npm run build`.
- [ ] Run `PORT=3001 npm run start:dev`.
- [ ] Verify `src/schema.gql` includes `ReceptionPayoutMethod` and non-null `currency` + `method` in reception method type.

7. Smoke tests
- [ ] `receptionMethods` returns `currency` and `method`.
- [ ] `submitRemittanceV2` works when receiving currency is omitted.
- [ ] `submitRemittanceV2` rejects mismatched receiving currency.

8. Guardrails confirmation
- [ ] No auth/guards changes.
- [ ] No unrelated refactors.
- [ ] Changes localized to catalogs + remittance submit flow.
