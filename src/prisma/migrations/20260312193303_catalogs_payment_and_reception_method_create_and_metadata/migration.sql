-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('PLATFORM', 'MANUAL');

-- AlterTable
ALTER TABLE "PaymentMethod"
ADD COLUMN "additionalData" TEXT,
ADD COLUMN "type" "PaymentMethodType";

-- Backfill existing rows deterministically
UPDATE "PaymentMethod"
SET "type" = CASE
	WHEN "code" IN ('ZELLE', 'IBAN', 'STRIPE') THEN 'PLATFORM'::"PaymentMethodType"
	ELSE 'MANUAL'::"PaymentMethodType"
END
WHERE "type" IS NULL;

-- Enforce required column and default for new rows
ALTER TABLE "PaymentMethod"
ALTER COLUMN "type" SET DEFAULT 'MANUAL',
ALTER COLUMN "type" SET NOT NULL;
