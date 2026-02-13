/*
  Warnings:

  - Made the column `phone` on table `Beneficiary` required. This step will fail if there are existing NULL values in that column.
  - Made the column `addressLine1` on table `Beneficiary` required. This step will fail if there are existing NULL values in that column.
  - Made the column `documentNumber` on table `Beneficiary` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Beneficiary" ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "deliveryInstructions" TEXT,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "addressLine1" SET NOT NULL,
ALTER COLUMN "documentNumber" SET NOT NULL;
