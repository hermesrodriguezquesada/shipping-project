-- CreateEnum
CREATE TYPE "RemittanceStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'PROCESSING', 'FAILED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR');

-- AlterTable
ALTER TABLE "Beneficiary" ADD COLUMN     "favoriteAt" TIMESTAMP(3),
ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BeneficiaryUsage" (
    "beneficiaryId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "BeneficiaryUsage_pkey" PRIMARY KEY ("beneficiaryId")
);

-- CreateTable
CREATE TABLE "Remittance" (
    "id" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "status" "RemittanceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remittance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "remittanceId" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BeneficiaryUsage_ownerUserId_timesUsed_idx" ON "BeneficiaryUsage"("ownerUserId", "timesUsed");

-- CreateIndex
CREATE INDEX "BeneficiaryUsage_ownerUserId_lastUsedAt_idx" ON "BeneficiaryUsage"("ownerUserId", "lastUsedAt");

-- CreateIndex
CREATE INDEX "Remittance_senderUserId_createdAt_idx" ON "Remittance"("senderUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Remittance_beneficiaryId_idx" ON "Remittance"("beneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_remittanceId_key" ON "Transfer"("remittanceId");

-- CreateIndex
CREATE INDEX "Beneficiary_ownerUserId_isFavorite_idx" ON "Beneficiary"("ownerUserId", "isFavorite");

-- AddForeignKey
ALTER TABLE "BeneficiaryUsage" ADD CONSTRAINT "BeneficiaryUsage_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficiaryUsage" ADD CONSTRAINT "BeneficiaryUsage_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remittance" ADD CONSTRAINT "Remittance_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remittance" ADD CONSTRAINT "Remittance_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_remittanceId_fkey" FOREIGN KEY ("remittanceId") REFERENCES "Remittance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
