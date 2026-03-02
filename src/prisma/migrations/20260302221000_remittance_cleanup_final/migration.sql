-- Backfill any legacy DRAFT rows before enum rewrite
UPDATE "Remittance"
SET "status" = 'PENDING_PAYMENT'
WHERE "status" = 'DRAFT';

-- Recreate enum without DRAFT
CREATE TYPE "RemittanceStatus_new" AS ENUM (
  'PENDING_PAYMENT',
  'PENDING_PAYMENT_CONFIRMATION',
  'PAID_SENDING_TO_RECEIVER',
  'SUCCESS',
  'PAYMENT_ERROR',
  'CANCELED_BY_CLIENT',
  'CANCELED_BY_ADMIN',
  'SUBMITTED',
  'CANCELLED',
  'COMPLETED'
);

ALTER TABLE "Remittance"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "RemittanceStatus_new" USING ("status"::text::"RemittanceStatus_new");

DROP TYPE "RemittanceStatus";
ALTER TYPE "RemittanceStatus_new" RENAME TO "RemittanceStatus";

ALTER TABLE "Remittance"
ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
