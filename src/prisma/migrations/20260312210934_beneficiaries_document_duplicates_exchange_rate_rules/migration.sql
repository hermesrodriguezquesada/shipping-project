-- DropIndex
DROP INDEX "Beneficiary_ownerUserId_documentNumber_key";

-- CreateIndex
CREATE INDEX "Beneficiary_ownerUserId_documentNumber_idx" ON "Beneficiary"("ownerUserId", "documentNumber");
