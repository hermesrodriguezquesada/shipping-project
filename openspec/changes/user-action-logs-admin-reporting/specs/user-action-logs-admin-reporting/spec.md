## ADDED Requirements

### Requirement: Admin can query user action log summary
The system MUST expose an admin-only query that returns aggregated summary metrics for user action logs within a filtered date range, without changing the phase 1 logging behavior or existing list queries.

#### Scenario: Admin obtains summary by date range
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` executes `adminUserActionLogSummary` with valid `dateFrom` and `dateTo`
- **THEN** the system returns `totalActions`, `uniqueActors`, `dateFrom`, and `dateTo`

#### Scenario: Summary respects optional filters
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` executes `adminUserActionLogSummary` with `actorUserId`, `action`, `resourceType`, or `resourceId`
- **THEN** the returned counts MUST be calculated from the filtered subset only

### Requirement: Admin can analyze user action log activity trends
The system MUST expose admin-only queries for daily activity buckets, top actors, and top actions using the same administrative filters and without exposing data to non-admin users.

#### Scenario: Admin obtains activity by day
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` executes `adminUserActionLogActivityByDay` with a valid reporting filter
- **THEN** the system returns daily buckets containing `date`, `actionCount`, and `uniqueActors`

#### Scenario: Admin obtains top actors
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` executes `adminUserActionLogTopActors` with a valid reporting filter and optional `limit`
- **THEN** the system returns rows with `actorUserId`, `actorEmail`, `actorRole`, `actionCount`, and `lastActionAt` ordered by activity

#### Scenario: Admin obtains top actions
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` executes `adminUserActionLogTopActions` with a valid reporting filter
- **THEN** the system returns aggregated rows with `action` and `actionCount`

#### Scenario: Non-admin user cannot access reporting
- **WHEN** an authenticated actor without role `ADMIN` or `EMPLOYEE` executes any phase 2 reporting query
- **THEN** the system MUST deny access and MUST NOT return reporting data

### Requirement: Admin can export filtered user action logs as CSV
The system MUST allow authorized administrative actors to export filtered user action logs as on-demand CSV content encoded in base64, without persisting the export and without exposing additional sensitive data.

#### Scenario: Admin exports CSV
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` executes `adminExportUserActionLogs` with valid filters
- **THEN** the system returns `contentBase64`, `fileName`, `mimeType`, `sizeBytes`, and `generatedAt`

#### Scenario: Export respects filters and pagination
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` executes `adminExportUserActionLogs` with `actorUserId`, `action`, `resourceType`, `resourceId`, `limit`, or `offset`
- **THEN** the CSV rows MUST reflect exactly that filtered and paginated subset

#### Scenario: Export does not expose additional sensitive data
- **WHEN** the system generates the CSV export payload
- **THEN** it MUST only include safe log fields already available in the module and MUST NOT add passwords, tokens, binary payloads, S3 keys, images, documents, or full bank data

### Requirement: Phase 1 user action log behavior remains unchanged
The system MUST preserve the existing phase 1 write path, non-blocking logging integration, and list query behavior while adding phase 2 administrative reporting capabilities.

#### Scenario: Existing list queries remain unchanged
- **WHEN** phase 2 reporting is added to the module
- **THEN** `myUserActionLogs` and `adminUserActionLogs` continue to behave as before

#### Scenario: Existing logging integration remains unchanged
- **WHEN** phase 2 reporting capabilities are implemented
- **THEN** the current non-blocking write behavior and metadata sanitization rules from phase 1 remain in effect