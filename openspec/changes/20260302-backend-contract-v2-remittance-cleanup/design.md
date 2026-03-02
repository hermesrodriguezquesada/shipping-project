# Design: backend contract V2 remittance cleanup

## Architecture
Maintain hexagonal boundaries:
- Presentation: GraphQL resolver accepts V2 input and maps output.
- Application: `SubmitRemittanceV2UseCase` validates and orchestrates.
- Domain ports: remittance command/query + availability ports for currency/payment/reception methods.
- Infrastructure adapters: Prisma adapters persist and query remittances.

## submitRemittanceV2 flow
1. Validate ownership (`beneficiaryBelongsToUser`).
2. Validate amount bounds using app config min/max.
3. Validate payment method enabled and consistent with `originAccount.originAccountType`.
4. Validate reception method enabled and CUP transfer card requirement.
5. Validate payment/receiving currencies enabled.
6. Validate origin account holder fields by `PERSON/COMPANY`.
7. Validate origin account fields by `ZELLE/IBAN/STRIPE`.
8. Calculate pricing snapshots with `PricingCalculatorService` (commission, delivery, FX, net receiving).
9. Persist remittance directly in `PENDING_PAYMENT` with immutable snapshots and `feesBreakdownJson`.
10. Return read model with catalog relationships for frontend.

## Backward compatibility strategy
- Keep legacy operations operational:
  - `createRemittanceDraft`
  - `setRemittanceReceptionMethod`
  - `setRemittanceDestinationCupCard`
  - `setRemittanceOriginAccountHolder`
- Mark as deprecated in GraphQL with reason:
  - `DEPRECATED: use submitRemittanceV2 (remove after 2026-06-30)`
- Legacy `submitRemittance` remains available.

## Remittance contract cleanup
- Keep old duplicated fields as deprecated when needed for compatibility:
  - `amount` (deprecated; use `paymentAmount`)
  - `currency` (deprecated; use `paymentCurrency`)
  - `paymentMethodCode` (deprecated; use `paymentMethod.code`)
  - `receptionMethodCatalog` and `receptionMethodCode` (deprecated; use `receptionMethod`)
- Remove from GraphQL:
  - `transfer`
  - `exchangeRateUsedAt`
- Add/clarify:
  - `paymentAmount` (payer amount)
  - `receivingAmount` (mapped from `netReceivingAmount` snapshot)
  - `feesBreakdownJson` (serialized fee/tax/FX breakdown)

## Persistence changes
- Prisma `Remittance`: add nullable `feesBreakdownJson String?`.
- Drop `Transfer` model/table and enum `TransferStatus`.
- Remove read/write adapter dependencies on transfer relation and transfer creation.

## Risks and mitigations
- Risk: consumers still using legacy fields/mutations.
  - Mitigation: keep deprecated compatibility window until 2026-06-30.
- Risk: migration in non-interactive CI/dev environments.
  - Mitigation: include migration SQL in repo and document `migrate dev` interactivity caveat.
