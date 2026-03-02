# Proposal: Backend contract V2 remittance cleanup

## Problem
The current remittance wizard contract requires draft creation plus multiple step mutations (`createRemittanceDraft`, `setRemittance*`), which creates abandoned draft data and unnecessary client-server roundtrips.

Frontend also reports contract inconsistencies in remittance payloads (duplicated fields, missing consolidated amounts), and auth registration must consistently include refresh token behavior.

## Goals
- Introduce a single submit mutation (`submitRemittanceV2`) that receives the full payload and creates the remittance directly in `PENDING_PAYMENT`.
- Keep legacy wizard mutations temporarily for compatibility, but mark them deprecated and define a removal plan.
- Clean `RemittanceType` GraphQL shape to remove duplicated/unused fields and expose clear amount semantics.
- Remove `Transfer` model and relation as redundant for current product lifecycle.
- Ensure `register` returns complete `AuthPayload` including `refreshToken`.

## Scope
1. GraphQL API
   - Add `submitRemittanceV2(input: SubmitRemittanceV2Input!): RemittanceType!`.
   - Keep legacy mutations available but deprecated (removal target: 2026-06-30).
   - Clean remittance output shape (prefer `paymentCurrency`, `paymentMethod`, `receptionMethod`; expose `paymentAmount`, `receivingAmount`, `feesBreakdownJson`).
2. Application/domain
   - Add `SubmitRemittanceV2UseCase` following hexagonal flow (resolver -> use-case -> ports -> adapters).
   - Reuse pricing/fx snapshot calculations and preserve immutable pricing data.
3. Persistence
   - Remove `Transfer` table and Prisma model/relation.
   - Add nullable `feesBreakdownJson` in `Remittance`.
4. OpenSpec and QA
   - Provide copy/paste GraphQL QA flows with placeholders.

## Non-goals
- No forced immediate removal of legacy wizard operations.
- No business logic moved into resolvers.
- No changes to remittance lifecycle statuses beyond contract cleanup.
