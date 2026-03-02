# Specs: remittance cleanup final

## Mutation contract (final)

### Supported creation mutation

- `submitRemittanceV2(input: SubmitRemittanceV2Input!): RemittanceType!`

### Removed mutations

- `createRemittanceDraft`
- `createRemittanceDraftV2`
- `setRemittanceReceptionMethod`
- `setRemittanceDestinationCupCard`
- `setRemittanceOriginAccountHolder`
- `setRemittanceAmount`
- `setRemittanceOriginAccount`
- `setRemittanceReceivingCurrency`
- `submitRemittance` (legacy)

## RemittanceStatus (final)

`RemittanceStatus` no longer includes `DRAFT`.

## RemittanceType (final)

Removed fields:

- `amount`
- `currency`
- `paymentMethodCode`
- `receptionMethodCatalog`
- `receptionMethodCode`

Active fields include:

- `paymentAmount`
- `receivingAmount`
- `paymentCurrency`
- `paymentMethod`
- `receptionMethod`
- `feesBreakdownJson`

## Consistency guarantees

- No deprecated remittance creation flow remains.
- No orphan resolver/use-case/input for removed wizard operations remains.
- Creation path is singular and deterministic (`submitRemittanceV2` -> `PENDING_PAYMENT`).
