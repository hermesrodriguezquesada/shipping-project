## ADDED Requirements

### Requirement: Protected elTOQUE rates proxy query
The system MUST expose a GraphQL query `elToqueRates(dateFrom: String, dateTo: String): String!` that SHALL be accessible only to authenticated users with role `ADMIN` or `EMPLOYEE`, using `GqlAuthGuard` and `RolesGuard`.

#### Scenario: ADMIN can execute query
- **WHEN** an authenticated user with role `ADMIN` calls `elToqueRates`
- **THEN** the query is authorized and processed

#### Scenario: EMPLOYEE can execute query
- **WHEN** an authenticated user with role `EMPLOYEE` calls `elToqueRates`
- **THEN** the query is authorized and processed

#### Scenario: CLIENT is rejected
- **WHEN** an authenticated user with role `CLIENT` calls `elToqueRates`
- **THEN** access is denied by role authorization

#### Scenario: Missing token is rejected
- **WHEN** a request without valid authentication token calls `elToqueRates`
- **THEN** access is denied by authentication guard

### Requirement: Raw upstream proxy behavior
The system MUST call `GET https://tasas.eltoque.com/v1/trmi` as a proxy using `Authorization: Bearer <token>` and SHALL return successful upstream payload as raw JSON string without transformation, modeling, or persistence.

#### Scenario: Successful upstream response is returned raw
- **WHEN** upstream responds successfully to the proxy request
- **THEN** the backend returns `String!` containing the raw JSON payload content

#### Scenario: dateFrom/dateTo mapping is applied
- **WHEN** `dateFrom` and/or `dateTo` are provided in GraphQL query
- **THEN** the request maps them to upstream query params `date_from` and `date_to` respectively

#### Scenario: Null optional args call latest window
- **WHEN** `dateFrom` and `dateTo` are omitted
- **THEN** the proxy request is sent without `date_from` and `date_to`

#### Scenario: No persistence side effects
- **WHEN** `elToqueRates` is executed
- **THEN** no database writes are performed and no Prisma persistence flow is used

### Requirement: Independent module boundary
The system MUST implement this capability in an independent module `src/modules/eltoque-rates/` with layers resolver -> use case -> port -> HTTP adapter, and MUST NOT use `exchange-rates` module, exchange-rates ports, or Prisma adapters.

#### Scenario: Module isolation is preserved
- **WHEN** the change is implemented
- **THEN** all new integration logic lives under `src/modules/eltoque-rates/` and does not reuse exchange-rates persistence components

### Requirement: Upstream error handling coverage
The system MUST handle upstream and transport errors for `401`, `422`, `429`, and timeout in the proxy flow, returning failure through GraphQL without altering successful payload behavior.

#### Scenario: Upstream 401 is surfaced as error
- **WHEN** upstream returns `401`
- **THEN** GraphQL query fails with an authorization-related error path

#### Scenario: Upstream 422 is surfaced as error
- **WHEN** upstream returns `422`
- **THEN** GraphQL query fails with validation/upstream error path

#### Scenario: Upstream 429 is surfaced as error
- **WHEN** upstream returns `429`
- **THEN** GraphQL query fails with rate-limit/upstream error path

#### Scenario: Upstream timeout is surfaced as error
- **WHEN** the upstream call exceeds configured timeout
- **THEN** GraphQL query fails with timeout error path

### Requirement: Configuration via environment variables
The system MUST read provider configuration from environment variables `ELTOQUE_API_BASE_URL`, `ELTOQUE_API_TOKEN`, and optional `ELTOQUE_TIMEOUT_MS`, and MUST NOT hardcode these values.

#### Scenario: Base URL and token come from config
- **WHEN** the adapter prepares the upstream request
- **THEN** URL base and bearer token are obtained from validated runtime configuration

#### Scenario: Optional timeout is configurable
- **WHEN** `ELTOQUE_TIMEOUT_MS` is provided
- **THEN** the upstream request timeout uses that configured value

### Requirement: GraphQL contract validation in code-first flow
The change MUST pass mandatory GraphQL validation flow for this repository.

#### Scenario: Build succeeds
- **WHEN** `npm run build` is executed
- **THEN** compilation completes successfully

#### Scenario: Runtime schema generation succeeds
- **WHEN** `PORT=3001 npm run start:dev` is executed
- **THEN** application starts and generates updated `src/schema.gql`

#### Scenario: Query appears in generated schema
- **WHEN** `src/schema.gql` is reviewed after startup
- **THEN** `elToqueRates(dateFrom: String, dateTo: String): String!` is present