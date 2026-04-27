## ADDED Requirements

### Requirement: Admin can fetch a dashboard-ready user action log bundle
The system MUST expose an admin-only query `adminUserActionLogDashboard` that returns a dashboard-ready bundle containing aggregated audit data for a bounded filter, without requiring the frontend to orchestrate multiple requests.

#### Scenario: Admin obtains complete dashboard payload
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` executes `adminUserActionLogDashboard` with a valid filter
- **THEN** the system returns `summary`, `activityByDay`, `topActors`, `topActions`, and `recentCriticalActions`

#### Scenario: Dashboard respects the same administrative filters
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` executes `adminUserActionLogDashboard` with `dateFrom`, `dateTo`, `actorUserId`, `action`, `resourceType`, or `resourceId`
- **THEN** every segment in the payload MUST be calculated from the same filtered subset

### Requirement: Dashboard reuses existing reporting semantics
The system MUST preserve the semantics of the phase 2 reporting aggregates when exposing them through the dashboard query.

#### Scenario: Existing summary semantics remain unchanged inside dashboard
- **WHEN** the dashboard returns `summary`, `activityByDay`, `topActors`, and `topActions`
- **THEN** those segments MUST match the same filtering and authorization rules already defined for the existing reporting queries

#### Scenario: Non-admin actor cannot access dashboard
- **WHEN** an authenticated actor without role `ADMIN` or `EMPLOYEE` executes `adminUserActionLogDashboard`
- **THEN** the system MUST deny access and MUST NOT return dashboard data

### Requirement: Dashboard includes recent critical actions with bounded cost
The system MUST include a recent critical actions segment that highlights sensitive or high-risk actions using a bounded query.

#### Scenario: Dashboard returns recent critical actions
- **WHEN** an authorized actor executes `adminUserActionLogDashboard`
- **THEN** the `recentCriticalActions` segment MUST return the most recent matching critical log rows ordered by recency

#### Scenario: Critical actions query remains bounded
- **WHEN** the system calculates `recentCriticalActions`
- **THEN** it MUST apply a fixed or validated maximum limit and MUST NOT run an unbounded read