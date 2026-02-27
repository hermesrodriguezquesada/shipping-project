-- CreateEnum
CREATE TYPE "ReceptionMethod" AS ENUM ('USD_CASH', 'CUP_CASH', 'CUP_TRANSFER', 'MLC', 'USD_CLASSIC');

-- CreateEnum
CREATE TYPE "OriginAccountHolderType" AS ENUM ('PERSON', 'COMPANY');

-- AlterTable
ALTER TABLE "Remittance"
ADD COLUMN "receptionMethod" "ReceptionMethod",
ADD COLUMN "destinationCupCardNumber" TEXT,
ADD COLUMN "originAccountHolderType" "OriginAccountHolderType",
ADD COLUMN "originAccountHolderFirstName" TEXT,
ADD COLUMN "originAccountHolderLastName" TEXT,
ADD COLUMN "originAccountHolderCompanyName" TEXT;