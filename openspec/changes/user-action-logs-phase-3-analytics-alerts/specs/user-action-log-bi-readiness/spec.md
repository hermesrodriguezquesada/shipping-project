## ADDED Requirements

### Requirement: User action log data is prepared for future BI consumption
The system MUST leave a minimal, governed base for future BI consumption without implementing a full BI integration in this phase.

#### Scenario: Audit tables are documented for BI
- **WHEN** the phase is completed
- **THEN** the system documentation MUST identify the relevant audit tables or views and the intended read-only usage for BI consumers

#### Scenario: BI readiness does not duplicate data
- **WHEN** BI readiness is implemented in this phase
- **THEN** it MUST continue using `UserActionLog` as the source of truth and MUST NOT duplicate audit data into a new analytics store

### Requirement: Simple BI read surface is optional and bounded
The system MAY expose a simple SQL view for BI readiness if doing so stays within the incremental scope and does not add operational complexity.

#### Scenario: Optional BI view stays simple
- **WHEN** a BI view is added in this phase
- **THEN** it MUST be a simple read-only projection over the existing audit data needed for future external consumption