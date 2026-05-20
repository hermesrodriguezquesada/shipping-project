-- Migration: drop isVisibleToOwner from Beneficiary, make beneficiaryId nullable in Remittance.
--
-- Step 1: Soft-delete beneficiaries that were hidden from owner (isVisibleToOwner=false).
-- These were created as "temporary" beneficiaries for remesas with saveManualBeneficiary=false.
-- Dropping the column without this step would make them visible in listByOwner queries.
UPDATE "Beneficiary"
SET "isDeleted" = true, "deletedAt" = NOW()
WHERE "isVisibleToOwner" = false AND "isDeleted" = false;

-- Step 2: Drop the isVisibleToOwner column.
ALTER TABLE "Beneficiary" DROP COLUMN "isVisibleToOwner";

-- Step 3: Make beneficiaryId nullable in Remittance.
-- Allows remesas created with saveManualBeneficiary=false to have no FK to Beneficiary.
ALTER TABLE "Remittance" ALTER COLUMN "beneficiaryId" DROP NOT NULL;
