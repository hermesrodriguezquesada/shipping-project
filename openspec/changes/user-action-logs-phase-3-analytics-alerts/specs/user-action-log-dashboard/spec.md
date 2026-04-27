## ADDED Requirements

### Requirement: Admin can fetch a unified user action log dashboard
The system MUST expose an admin-only query `adminUserActionLogDashboard` that returns a unified dashboard payload for user action logs using existing reporting capabilities plus a bounded list of recent critical actions.

#### Scenario: Admin obtains complete dashboard payload
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` executes `adminUserActionLogDashboard` with a valid filter
- **THEN** the system returns `summary`, `activityByDay`, `topActors`, `topActions`, and `recentCriticalActions`

#### Scenario: Dashboard remains bounded
- **WHEN** the system calculates `activityByDay`, `topActors`, `topActions`, and `recentCriticalActions`
- **THEN** it MUST enforce bounded date ranges and explicit or internal limits for the list segments

### Requirement: Dashboard reuses phase 2 reporting semantics
The system MUST build the dashboard by reusing the existing phase 2 reporting logic instead of recalculating the same aggregates through a separate implementation path.

#### Scenario: Existing aggregates keep their semantics
- **WHEN** the dashboard returns `summary`, `activityByDay`, `topActors`, and `topActions`
- **THEN** those segments MUST preserve the same filtering and authorization semantics already defined by the existing reporting queries

#### Scenario: Non-admin actor cannot access dashboard
- **WHEN** an authenticated actor without role `ADMIN` or `EMPLOYEE` executes `adminUserActionLogDashboard`
- **THEN** the system MUST deny access and MUST NOT return dashboard data