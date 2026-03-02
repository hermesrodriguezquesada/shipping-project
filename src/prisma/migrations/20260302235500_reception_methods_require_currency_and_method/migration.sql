CREATE TYPE "ReceptionPayoutMethod" AS ENUM ('CASH', 'TRANSFER');

ALTER TABLE "ReceptionMethodCatalog"
  ADD COLUMN "currencyId" TEXT,
  ADD COLUMN "method" "ReceptionPayoutMethod";

DO $$
DECLARE
  unknown_code TEXT;
BEGIN
  SELECT "code"
  INTO unknown_code
  FROM "ReceptionMethodCatalog"
  WHERE "code" NOT IN ('USD_CASH', 'CUP_CASH', 'CUP_TRANSFER', 'MLC', 'USD_CLASSIC')
  LIMIT 1;

  IF unknown_code IS NOT NULL THEN
    RAISE EXCEPTION 'ReceptionMethodCatalog contains unmapped code: %', unknown_code;
  END IF;
END $$;

DO $$
DECLARE
  missing_codes TEXT;
BEGIN
  SELECT string_agg(required.code, ', ' ORDER BY required.code)
  INTO missing_codes
  FROM (
    VALUES ('USD'), ('CUP'), ('MLC')
  ) AS required(code)
  LEFT JOIN "CurrencyCatalog" c ON c."code" = required.code
  WHERE c."id" IS NULL;

  IF missing_codes IS NOT NULL THEN
    RAISE EXCEPTION 'CurrencyCatalog is missing required codes: %', missing_codes;
  END IF;
END $$;

WITH mapping AS (
  SELECT *
  FROM (
    VALUES
      ('USD_CASH', 'USD', 'CASH'),
      ('CUP_CASH', 'CUP', 'CASH'),
      ('CUP_TRANSFER', 'CUP', 'TRANSFER'),
      ('MLC', 'MLC', 'TRANSFER'),
      ('USD_CLASSIC', 'USD', 'TRANSFER')
  ) AS data(code, currency_code, payout_method)
)
UPDATE "ReceptionMethodCatalog" rm
SET
  "currencyId" = c."id",
  "method" = mapping.payout_method::"ReceptionPayoutMethod"
FROM mapping
JOIN "CurrencyCatalog" c ON c."code" = mapping.currency_code
WHERE rm."code" = mapping.code;

DO $$
DECLARE
  remaining_nulls INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO remaining_nulls
  FROM "ReceptionMethodCatalog"
  WHERE "currencyId" IS NULL OR "method" IS NULL;

  IF remaining_nulls > 0 THEN
    RAISE EXCEPTION 'ReceptionMethodCatalog backfill incomplete. Rows with null currencyId/method: %', remaining_nulls;
  END IF;
END $$;

ALTER TABLE "ReceptionMethodCatalog"
  ALTER COLUMN "currencyId" SET NOT NULL,
  ALTER COLUMN "method" SET NOT NULL;

ALTER TABLE "ReceptionMethodCatalog"
  ADD CONSTRAINT "ReceptionMethodCatalog_currencyId_fkey"
  FOREIGN KEY ("currencyId") REFERENCES "CurrencyCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ReceptionMethodCatalog_currencyId_idx" ON "ReceptionMethodCatalog"("currencyId");
