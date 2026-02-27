-- Backfill legacy statuses after enum values exist and are committed
UPDATE "Remittance"
SET "status" = 'PENDING_PAYMENT'
WHERE "status" = 'SUBMITTED';

UPDATE "Remittance"
SET "status" = 'SUCCESS'
WHERE "status" = 'COMPLETED';

UPDATE "Remittance"
SET "status" = 'CANCELED_BY_ADMIN'
WHERE "status" = 'CANCELLED';