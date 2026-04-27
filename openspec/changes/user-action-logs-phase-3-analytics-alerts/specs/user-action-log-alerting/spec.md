## ADDED Requirements

### Requirement: System can generate basic user action alerts inline
The system MUST evaluate a minimal set of suspicious-behavior thresholds inline with the existing logging flow and persist a `UserActionAlert` without blocking the original action.

#### Scenario: Login threshold creates an alert
- **WHEN** the same actor exceeds 5 `LOGIN` actions inside 5 minutes
- **THEN** the system MUST persist a `UserActionAlert` describing that login threshold breach

#### Scenario: Remittance cancellation threshold creates an alert
- **WHEN** the same actor exceeds 3 `CANCEL_REMITTANCE` actions inside the configured short window
- **THEN** the system MUST persist a `UserActionAlert` describing that cancellation threshold breach

### Requirement: Basic admin-sensitive activity threshold is supported
The system MUST support a simple threshold for sensitive administrative actions using a configurable or documented initial threshold.

#### Scenario: Admin-sensitive threshold creates an alert
- **WHEN** the same actor exceeds the configured threshold for sensitive administrative actions inside the configured recent window
- **THEN** the system MUST persist a `UserActionAlert` with a safe description and safe metadata

### Requirement: Alert detection remains non-blocking
The system MUST treat alert detection and alert persistence as best-effort behavior that cannot fail the original action or the underlying user action log write.

#### Scenario: Alert persistence failure does not break the original flow
- **WHEN** alert detection or alert persistence throws an error
- **THEN** the original business action and log write MUST continue normally

#### Scenario: Alert model remains minimal in MVP
- **WHEN** a `UserActionAlert` is persisted in this phase
- **THEN** it MUST include only the minimum fields `id`, `type`, `actorUserId`, `description`, `metadataJson`, and `createdAt`