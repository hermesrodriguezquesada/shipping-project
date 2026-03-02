# Design: remittance cleanup final

## Target contract

Creation flow is reduced to a single operation:

- `submitRemittanceV2(input: SubmitRemittanceV2Input!): RemittanceType!`

Legacy wizard operations are fully removed from GraphQL schema and codebase.

## Hexagonal alignment

- Resolver: only orchestrates request/response mapping.
- Use-case: `SubmitRemittanceV2UseCase` validates and coordinates business rules.
- Ports: `RemittanceCommandPort` and `RemittanceQueryPort` keep only active operations.
- Adapters: Prisma adapters implement only active port methods.

## Remittance response shape

`RemittanceType` keeps only current fields:

- `paymentAmount`
- `receivingAmount`
- `paymentCurrency`
- `paymentMethod`
- `receptionMethod`
- `feesBreakdownJson`
(and existing non-legacy metadata/status fields)

Removed legacy fields:

- `amount`
- `currency`
- `paymentMethodCode`
- `receptionMethodCatalog`
- `receptionMethodCode`

## Lifecycle status cleanup

`DRAFT` is removed from `RemittanceStatus` enum.
`submitRemittanceV2` creates remittances directly as `PENDING_PAYMENT`.

## Data migration

- Backfill existing `DRAFT` records to `PENDING_PAYMENT`.
- Recreate enum type without `DRAFT`.
