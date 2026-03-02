-- AlterTable
ALTER TABLE "Remittance" ADD COLUMN "feesBreakdownJson" TEXT;

-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_remittanceId_fkey";

-- DropTable
DROP TABLE "Transfer";

-- DropEnum
DROP TYPE "TransferStatus";
