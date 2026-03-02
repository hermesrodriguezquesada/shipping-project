# Proposal: remittance cleanup final

## Motivation

After introducing `submitRemittanceV2`, the backend still contained legacy wizard mutations, use-cases, DTOs, and enum values that are no longer part of the product flow.

This technical debt increases maintenance cost, confuses API consumers, and risks accidental divergence between frontend and backend behavior.

## Objective

Perform a hard cleanup to remove all wizard/deprecated remittance creation artifacts and leave a single coherent contract.

## Scope

- Remove legacy remittance wizard mutations and related inputs/resolvers/use-cases.
- Remove `DRAFT` status from remittance lifecycle enum and dependent code.
- Remove legacy fields from `RemittanceType` and response mappings.
- Ensure only `submitRemittanceV2` remains as creation flow.
- Keep lifecycle/admin operations intact.
- Run validation commands and provide literal evidence.
