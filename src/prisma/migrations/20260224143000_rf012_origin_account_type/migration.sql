-- CreateEnum
CREATE TYPE "OriginAccountType" AS ENUM ('ZELLE', 'IBAN', 'STRIPE');

-- AlterTable
ALTER TABLE "Remittance"
ADD COLUMN     "originAccountType" "OriginAccountType",
ADD COLUMN     "originIban" TEXT,
ADD COLUMN     "originStripePaymentMethodId" TEXT,
ADD COLUMN     "originZelleEmail" TEXT;
