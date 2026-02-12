-- CreateEnum
CREATE TYPE "BeneficiaryRelationship" AS ENUM ('FAMILY', 'FRIEND', 'BUSINESS', 'OTHER');

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "addressLine1" TEXT,
    "postalCode" TEXT,
    "documentType" "DocumentType",
    "documentNumber" TEXT,
    "relationship" "BeneficiaryRelationship" DEFAULT 'OTHER',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Beneficiary_ownerUserId_idx" ON "Beneficiary"("ownerUserId");

-- CreateIndex
CREATE INDEX "Beneficiary_ownerUserId_isDeleted_idx" ON "Beneficiary"("ownerUserId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiary_ownerUserId_documentNumber_key" ON "Beneficiary"("ownerUserId", "documentNumber");

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
