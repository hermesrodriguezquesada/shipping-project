# Tasks: remittance recipient snapshot and inline beneficiary create

## 1) Prisma schema + migration

- [ ] Update `src/prisma/schema.prisma`:
  - [ ] Add recipient snapshot columns to `Remittance` (required + optional as specified).
  - [ ] Keep `beneficiaryId` persisted (still required by final write-path behavior).
- [ ] Create migration SQL:
  - [ ] Add recipient columns as nullable first.
  - [ ] Backfill from `Beneficiary` via `Remittance.beneficiaryId`.
  - [ ] Assert required recipient columns have no nulls.
  - [ ] Set required recipient columns to NOT NULL.

## 2) GraphQL contract (code-first)

- [ ] Add `ManualBeneficiaryInput` in remittances GraphQL inputs.
- [ ] Update `SubmitRemittanceV2Input`:
  - [ ] `beneficiaryId` optional.
  - [ ] `manualBeneficiary` optional.
- [ ] Add `RemittanceRecipientType` output.
- [ ] Add `recipient: RemittanceRecipientType!` to `RemittanceType`.
- [ ] Keep `beneficiary` field unchanged for compatibility.

## 3) submitRemittanceV2 write path

- [ ] Enforce XOR validation (`beneficiaryId` vs `manualBeneficiary`).
- [ ] If `beneficiaryId` path:
  - [ ] Validate ownership.
  - [ ] Load beneficiary for snapshot.
- [ ] If `manualBeneficiary` path:
  - [ ] Create beneficiary owned by sender.
  - [ ] Use created beneficiary for snapshot.
- [ ] Persist remittance with:
  - [ ] `beneficiaryId` always set.
  - [ ] recipient snapshot columns always set.
- [ ] Keep pricing/lifecycle logic unchanged.

## 4) Read path

- [ ] Extend remittance read model/query adapter to return recipient snapshot fields.
- [ ] Map `RemittanceType.recipient` from snapshot columns only.
- [ ] Preserve existing `beneficiary` mapping behavior.

## 5) Validation

- [ ] Run `npm run build`.
- [ ] Run `PORT=3001 npm run start:dev`.
- [ ] Verify generated `src/schema.gql` includes:
  - [ ] `ManualBeneficiaryInput`
  - [ ] `RemittanceRecipientType`
  - [ ] `RemittanceType.recipient: RemittanceRecipientType!`
  - [ ] `SubmitRemittanceV2Input` with optional `beneficiaryId` and optional `manualBeneficiary`

## 6) Smoke tests

- [ ] `submitRemittanceV2` with existing `beneficiaryId` succeeds; `recipient` equals beneficiary data at creation.
- [ ] `submitRemittanceV2` with `manualBeneficiary` succeeds; beneficiary is created and remittance linked.
- [ ] Update beneficiary after remittance creation; verify `remittance.recipient` remains unchanged.
- [ ] Confirm `schema.gql` contains new recipient contract.

## 7) Guardrails

- [ ] No auth/guard changes.
- [ ] No unrelated refactors.
- [ ] Changes limited to remittance beneficiary handling + snapshot display semantics.
