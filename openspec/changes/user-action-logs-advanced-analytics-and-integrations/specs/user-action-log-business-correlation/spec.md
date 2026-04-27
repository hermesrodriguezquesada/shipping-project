## ADDED Requirements

### Requirement: User action logs can carry business correlation identifiers
The system MUST allow user action logs to persist a nullable `correlationId` so that multiple actions related to the same business process can be traced together.

#### Scenario: Remittance flow logs share a correlation identifier
- **WHEN** multiple user action logs are generated for the same remittance lifecycle
- **THEN** the system MUST persist the same `correlationId` across those related log rows when that identifier is available

#### Scenario: Historical logs remain compatible without correlationId
- **WHEN** a user action log predates the introduction of `correlationId` or the flow has no meaningful correlation identifier
- **THEN** the system MUST allow `correlationId` to remain null without breaking existing queries

### Requirement: Correlation metadata remains safe and traceable
The system MUST allow business correlation metadata that is sufficient to understand state transitions while preserving the existing metadata sanitization rules.

#### Scenario: Remittance status change is represented safely
- **WHEN** a remittance-related action log is persisted
- **THEN** the metadata MAY include safe fields such as `remittanceId`, `previousStatus`, and `newStatus` needed for traceability

#### Scenario: Correlation metadata does not expose sensitive payloads
- **WHEN** the system persists correlation metadata
- **THEN** it MUST NOT store full request payloads, binary files, secrets, or other sensitive data beyond the safe identifiers and state fields needed for audit traceability

### Requirement: Authorized actors can trace correlated business actions
The system MUST make correlation fields available to the authorized administrative read surfaces needed to investigate business flows.

#### Scenario: Admin traces a correlated remittance flow
- **WHEN** an actor with role `ADMIN` or `EMPLOYEE` filters or inspects logs by `correlationId` or correlated metadata
- **THEN** the system MUST allow that actor to follow the related remittance actions across multiple log entries