-- Add owner visibility control for beneficiaries.
ALTER TABLE "Beneficiary"
ADD COLUMN "isVisibleToOwner" BOOLEAN NOT NULL DEFAULT true;
