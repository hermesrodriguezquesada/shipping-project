-- CreateEnum
CREATE TYPE "IdentityStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'PASSPORT', 'DRIVER_LICENSE');

-- CreateTable
CREATE TABLE "UserIdentityVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "IdentityStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "documentType" "DocumentType",
    "documentNumber" TEXT,
    "fullName" TEXT,
    "birthDate" TIMESTAMP(3),
    "country" TEXT,
    "city" TEXT,
    "addressLine1" TEXT,
    "documentFrontUrl" TEXT,
    "documentBackUrl" TEXT,
    "selfieUrl" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentityVerification_userId_key" ON "UserIdentityVerification"("userId");

-- CreateIndex
CREATE INDEX "UserIdentityVerification_status_idx" ON "UserIdentityVerification"("status");

-- AddForeignKey
ALTER TABLE "UserIdentityVerification" ADD CONSTRAINT "UserIdentityVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
