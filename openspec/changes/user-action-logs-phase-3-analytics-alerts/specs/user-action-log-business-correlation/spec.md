## ADDED Requirements

### Requirement: User action logs can optionally store a correlation identifier
The system MUST allow `UserActionLog` rows to persist a nullable `correlationId` so related business actions can be traced together without requiring the field for every log.

#### Scenario: Remittance logs share a correlation identifier
- **WHEN** multiple user action logs belong to the same remittance lifecycle and a correlation identifier is available
- **THEN** the system MUST persist the same `correlationId` across those related log rows

#### Scenario: Existing logs remain valid without correlationId
- **WHEN** a historical log row or a non-correlated action has no correlation identifier
- **THEN** the system MUST allow `correlationId` to remain null without breaking existing reads

### Requirement: Correlation metadata remains safe
The system MUST keep business correlation metadata limited to safe identifiers and status-like fields needed for traceability.

#### Scenario: Safe remittance correlation metadata is stored
- **WHEN** a remittance-related log includes correlation metadata
- **THEN** the metadata MAY include fields such as `remittanceId`, `previousStatus`, and `newStatus` needed for traceability

#### Scenario: Sensitive payloads are not introduced through correlation
- **WHEN** correlation metadata is persisted
- **THEN** it MUST NOT include secrets, binary payloads, full documents, or other sensitive request data