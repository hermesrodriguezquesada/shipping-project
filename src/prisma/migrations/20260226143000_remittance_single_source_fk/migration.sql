-- Backfill FK sources from legacy enum columns before dropping duplicated sources
UPDATE "Remittance" r
SET "paymentMethodId" = pm."id"
FROM "PaymentMethod" pm
WHERE r."paymentMethodId" IS NULL
  AND r."originAccountType" IS NOT NULL
  AND r."originAccountType"::text = pm."code";

UPDATE "Remittance" r
SET "receptionMethodId" = rm."id"
FROM "ReceptionMethodCatalog" rm
WHERE r."receptionMethodId" IS NULL
  AND r."receptionMethod" IS NOT NULL
  AND r."receptionMethod"::text = rm."code";

UPDATE "Remittance" r
SET "currencyId" = c."id"
FROM "CurrencyCatalog" c
WHERE r."currencyId" IS NULL
  AND r."currency" IS NOT NULL
  AND r."currency"::text = c."code";

-- Remove duplicated source-of-truth columns in Remittance
ALTER TABLE "Remittance"
  DROP COLUMN IF EXISTS "originAccountType",
  DROP COLUMN IF EXISTS "receptionMethod",
  DROP COLUMN IF EXISTS "currency";