## 1. Module scaffold and boundaries

- [ ] 1.1 Create module folder `src/modules/eltoque-rates/` with application, domain, infrastructure, and presentation subfolders
- [ ] 1.2 Create `src/modules/eltoque-rates/eltoque-rates.module.ts`
- [ ] 1.3 Register the new module in `src/app.module.ts`
- [ ] 1.4 Confirm no file is added or modified under `src/modules/exchange-rates/`

---

## 2. Domain and application contracts

- [ ] 2.1 Create port interface file under `src/modules/eltoque-rates/domain/ports/`
- [ ] 2.2 Define use case input with optional `dateFrom` and `dateTo`
- [ ] 2.3 Create use case file under `src/modules/eltoque-rates/application/use-cases/`
- [ ] 2.4 Ensure use case depends only on port interface and does not depend on Prisma

---

## 3. HTTP adapter and external integration

- [ ] 3.1 Create HTTP adapter file under `src/modules/eltoque-rates/infrastructure/adapters/`
- [ ] 3.2 Implement upstream call to `GET /v1/trmi` using configured base URL
- [ ] 3.3 Add auth header `Authorization: Bearer <token>` from runtime config
- [ ] 3.4 Map GraphQL args to upstream params:
  - `dateFrom -> date_from`
  - `dateTo -> date_to`
- [ ] 3.5 Return successful upstream payload serialized exactly once as JSON string (e.g. `JSON.stringify(response.data)`)
- [ ] 3.6 Add error handling path for upstream `401`, `422`, `429`, and timeout
- [ ] 3.7 Confirm adapter does not persist data and does not use Prisma

---

## 4. GraphQL resolver and security

- [ ] 4.1 Create resolver file under `src/modules/eltoque-rates/presentation/graphql/resolvers/`
- [ ] 4.2 Expose query `elToqueRates(dateFrom: String, dateTo: String): String!`
- [ ] 4.3 Apply `@UseGuards(GqlAuthGuard, RolesGuard)`
- [ ] 4.4 Apply `@Roles(Role.ADMIN, Role.EMPLOYEE)`
- [ ] 4.5 Confirm `CLIENT` is rejected by role authorization flow

---

## 5. Configuration and secrets

- [ ] 5.1 Add env variables to `src/core/config/env.validation.ts`
- [ ] 5.2 Add validation for `ELTOQUE_API_BASE_URL`
- [ ] 5.3 Add validation for `ELTOQUE_API_TOKEN`
- [ ] 5.4 Add optional validation for `ELTOQUE_TIMEOUT_MS`
- [ ] 5.5 Add getters in `src/core/config/config.service.ts`
- [ ] 5.6 Confirm no hardcoded token/base URL/timeout in source code

---

## 6. Module wiring and DI

- [ ] 6.1 Add DI token for new port in `src/shared/constants/tokens.ts`
- [ ] 6.2 Bind port token to HTTP adapter in `eltoque-rates.module.ts`
- [ ] 6.3 Register use case and resolver providers
- [ ] 6.4 Confirm wiring does not reference exchange-rates ports/adapters

---

## 7. Validation and tests

- [ ] 7.1 Run `npm run build`
- [ ] 7.2 Run `PORT=3001 npm run start:dev`
- [ ] 7.3 Verify `src/schema.gql` includes:
  - `elToqueRates(dateFrom: String, dateTo: String): String!`
- [ ] 7.4 Test success with `ADMIN`
- [ ] 7.5 Test success with `EMPLOYEE`
- [ ] 7.6 Test rejection with `CLIENT`
- [ ] 7.7 Test unauthenticated request rejection
- [ ] 7.8 Test upstream error handling (`401`, `422`, `429`, timeout)
- [ ] 7.9 Test param mapping (`dateFrom/dateTo`)

---

## 8. Final scope checklist

- [ ] 8.1 No persistence introduced
- [ ] 8.2 No payload transformation/modeling introduced
- [ ] 8.3 No JSON scalar introduced
- [ ] 8.4 No cache introduced
- [ ] 8.5 No changes in `exchange-rates`
- [ ] 8.6 No changes in JWT or guards