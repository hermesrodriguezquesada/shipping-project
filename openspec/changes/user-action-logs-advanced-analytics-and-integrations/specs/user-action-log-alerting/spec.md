## ADDED Requirements

### Requirement: System can generate user action alerts asynchronously
The system MUST evaluate configured suspicious-behavior rules asynchronously from user actions and persist `UserActionAlert` records without blocking the original business flow.

#### Scenario: Multiple logins in a short window create an alert
- **WHEN** the system records multiple `LOGIN` actions that exceed the configured threshold inside the configured time window
- **THEN** it MUST persist a `UserActionAlert` describing that suspicious login pattern

#### Scenario: Alert generation does not block the original action
- **WHEN** an alert rule is evaluated after a log is recorded
- **THEN** any failure during alert evaluation or alert persistence MUST NOT fail or roll back the original business action

### Requirement: Initial suspicious behavior rules are supported
The system MUST support initial alert rules for repeated logins, repeated remittance cancellations, bulk VIP payment proof creation, and sensitive administrative activity.

#### Scenario: Repeated remittance cancellations create an alert
- **WHEN** the configured cancellation threshold is exceeded for the same actor or window
- **THEN** the system MUST persist a `UserActionAlert` with type and severity appropriate for that rule

#### Scenario: Sensitive administrative activity creates an alert
- **WHEN** an administrative action classified as sensitive is recorded under the configured alerting rules
- **THEN** the system MUST persist a `UserActionAlert` with a secure description and safe metadata

### Requirement: Authorized admins can inspect and resolve alerts
The system MUST expose administrative access to persisted alerts and their resolution state for `ADMIN` and `EMPLOYEE` actors only.

#### Scenario: Admin lists persisted alerts
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` queries the alert surface
- **THEN** the system returns alert type, severity, actor linkage, description, safe metadata, `createdAt`, and `resolvedAt`

#### Scenario: Admin resolves an alert
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` marks an alert as resolved
- **THEN** the system MUST persist `resolvedAt` and keep the alert available for historical review