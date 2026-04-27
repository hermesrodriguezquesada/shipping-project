## ADDED Requirements

### Requirement: Authorized actors can configure recurring user action log exports
The system MUST allow authorized administrative actors to define recurring CSV export schedules with named filters and supported frequencies.

#### Scenario: Admin creates a daily export schedule
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` creates a schedule with frequency `daily` and valid filters
- **THEN** the system MUST persist a `UserActionLogExportSchedule` with `name`, `filtersJson`, `frequency`, `createdBy`, and `nextRunAt`

#### Scenario: Admin creates a weekly export schedule
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` creates a schedule with frequency `weekly` and valid filters
- **THEN** the system MUST persist the schedule and calculate the corresponding `nextRunAt`

### Requirement: Due schedules execute automatically using the existing export semantics
The system MUST execute due schedules asynchronously using the same CSV filtering and formatting semantics already approved for on-demand exports.

#### Scenario: Due schedule generates CSV automatically
- **WHEN** the scheduler detects a `UserActionLogExportSchedule` whose `nextRunAt` is due
- **THEN** the system MUST generate the CSV export automatically using that schedule's stored filters

#### Scenario: Schedule execution updates run timestamps
- **WHEN** the scheduled export finishes processing
- **THEN** the system MUST update `lastRunAt` and advance `nextRunAt` according to the configured frequency

### Requirement: Scheduled exports remain non-blocking and bounded
The system MUST run scheduled exports outside user request flows and MUST prevent unbounded or duplicate executions.

#### Scenario: Scheduled export does not block user requests
- **WHEN** the system runs a scheduled export
- **THEN** that execution MUST occur outside the original user mutation or query flow

#### Scenario: Scheduler avoids duplicate processing of the same schedule
- **WHEN** multiple runtime instances or overlapping scheduler ticks evaluate the same due schedule
- **THEN** the system MUST ensure that the schedule is not executed twice for the same due window