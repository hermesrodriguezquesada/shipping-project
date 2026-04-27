## ADDED Requirements

### Requirement: BI tools can consume governed audit data without duplication
The system MUST provide a governed read surface for BI tools such as Metabase without duplicating `UserActionLog` data into a separate analytical store for this phase.

#### Scenario: BI reads from governed audit surfaces
- **WHEN** an authorized BI consumer connects to the approved read surface
- **THEN** it MUST be able to query user action log data through documented views or optimized read queries

#### Scenario: BI access does not require a duplicated audit table
- **WHEN** the BI integration is enabled
- **THEN** the system MUST continue using the existing operational audit records as the source of truth

### Requirement: BI access is controlled and documented
The system MUST restrict BI access to approved read-only surfaces and document the meaning of exposed fields for operational analytics.

#### Scenario: BI access is read-only and limited
- **WHEN** a BI user is granted access
- **THEN** that access MUST be limited to read-only surfaces approved for BI consumption

#### Scenario: BI field semantics are documented
- **WHEN** the BI integration is prepared for external use
- **THEN** the system documentation MUST identify the available fields, filters, and access restrictions for those BI surfaces