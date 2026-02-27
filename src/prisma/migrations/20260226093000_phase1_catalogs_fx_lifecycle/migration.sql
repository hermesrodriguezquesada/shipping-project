-- Expand RemittanceStatus enum with phase 1 lifecycle states (idempotent-safe blocks)
DO $$ BEGIN
  ALTER TYPE "RemittanceStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "RemittanceStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT_CONFIRMATION';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "RemittanceStatus" ADD VALUE IF NOT EXISTS 'PAID_SENDING_TO_RECEIVER';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "RemittanceStatus" ADD VALUE IF NOT EXISTS 'SUCCESS';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "RemittanceStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_ERROR';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "RemittanceStatus" ADD VALUE IF NOT EXISTS 'CANCELED_BY_CLIENT';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "RemittanceStatus" ADD VALUE IF NOT EXISTS 'CANCELED_BY_ADMIN';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Catalog tables
CREATE TABLE IF NOT EXISTS "PaymentMethod" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "imgUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentMethod_code_key" ON "PaymentMethod"("code");

CREATE TABLE IF NOT EXISTS "ReceptionMethodCatalog" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "imgUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReceptionMethodCatalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReceptionMethodCatalog_code_key" ON "ReceptionMethodCatalog"("code");

CREATE TABLE IF NOT EXISTS "CurrencyCatalog" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "imgUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CurrencyCatalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CurrencyCatalog_code_key" ON "CurrencyCatalog"("code");

CREATE TABLE IF NOT EXISTS "ExchangeRate" (
  "id" TEXT NOT NULL,
  "fromCurrencyId" TEXT NOT NULL,
  "toCurrencyId" TEXT NOT NULL,
  "rate" DECIMAL(65,30) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExchangeRate_fromCurrencyId_toCurrencyId_enabled_createdAt_idx"
ON "ExchangeRate"("fromCurrencyId", "toCurrencyId", "enabled", "createdAt");

-- Remittance extensions
ALTER TABLE "Remittance"
  ADD COLUMN IF NOT EXISTS "paymentMethodId" TEXT,
  ADD COLUMN IF NOT EXISTS "receptionMethodId" TEXT,
  ADD COLUMN IF NOT EXISTS "currencyId" TEXT,
  ADD COLUMN IF NOT EXISTS "receivingCurrencyId" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "statusDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "exchangeRateIdUsed" TEXT,
  ADD COLUMN IF NOT EXISTS "exchangeRateRateUsed" DECIMAL(65,30),
  ADD COLUMN IF NOT EXISTS "exchangeRateUsedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Remittance_paymentMethodId_idx" ON "Remittance"("paymentMethodId");
CREATE INDEX IF NOT EXISTS "Remittance_receptionMethodId_idx" ON "Remittance"("receptionMethodId");
CREATE INDEX IF NOT EXISTS "Remittance_currencyId_idx" ON "Remittance"("currencyId");
CREATE INDEX IF NOT EXISTS "Remittance_receivingCurrencyId_idx" ON "Remittance"("receivingCurrencyId");

-- FKs
DO $$ BEGIN
  ALTER TABLE "ExchangeRate"
    ADD CONSTRAINT "ExchangeRate_fromCurrencyId_fkey"
    FOREIGN KEY ("fromCurrencyId") REFERENCES "CurrencyCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ExchangeRate"
    ADD CONSTRAINT "ExchangeRate_toCurrencyId_fkey"
    FOREIGN KEY ("toCurrencyId") REFERENCES "CurrencyCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Remittance"
    ADD CONSTRAINT "Remittance_paymentMethodId_fkey"
    FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Remittance"
    ADD CONSTRAINT "Remittance_receptionMethodId_fkey"
    FOREIGN KEY ("receptionMethodId") REFERENCES "ReceptionMethodCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Remittance"
    ADD CONSTRAINT "Remittance_currencyId_fkey"
    FOREIGN KEY ("currencyId") REFERENCES "CurrencyCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Remittance"
    ADD CONSTRAINT "Remittance_receivingCurrencyId_fkey"
    FOREIGN KEY ("receivingCurrencyId") REFERENCES "CurrencyCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Remittance"
    ADD CONSTRAINT "Remittance_exchangeRateIdUsed_fkey"
    FOREIGN KEY ("exchangeRateIdUsed") REFERENCES "ExchangeRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed initial catalogs (upsert-like)
INSERT INTO "PaymentMethod"("id", "code", "name", "enabled", "createdAt", "updatedAt")
VALUES
  ('00000000-0000-0000-0000-000000000001', 'ZELLE', 'Zelle', true, now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'IBAN', 'IBAN', true, now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'STRIPE', 'Stripe', true, now(), now())
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "ReceptionMethodCatalog"("id", "code", "name", "enabled", "createdAt", "updatedAt")
VALUES
  ('00000000-0000-0000-0000-000000000101', 'USD_CASH', 'USD Cash', true, now(), now()),
  ('00000000-0000-0000-0000-000000000102', 'CUP_CASH', 'CUP Cash', true, now(), now()),
  ('00000000-0000-0000-0000-000000000103', 'CUP_TRANSFER', 'CUP Transfer', true, now(), now()),
  ('00000000-0000-0000-0000-000000000104', 'MLC', 'MLC', true, now(), now()),
  ('00000000-0000-0000-0000-000000000105', 'USD_CLASSIC', 'USD Classic', true, now(), now())
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "CurrencyCatalog"("id", "code", "name", "enabled", "createdAt", "updatedAt")
VALUES
  ('00000000-0000-0000-0000-000000000201', 'USD', 'US Dollar', true, now(), now()),
  ('00000000-0000-0000-0000-000000000202', 'EUR', 'Euro', true, now(), now()),
  ('00000000-0000-0000-0000-000000000203', 'CUP', 'Cuban Peso', true, now(), now()),
  ('00000000-0000-0000-0000-000000000204', 'MLC', 'Moneda Libremente Convertible', true, now(), now())
ON CONFLICT ("code") DO NOTHING;

-- Backfill FK columns from legacy enum/code fields
UPDATE "Remittance" r
SET "paymentMethodId" = pm."id"
FROM "PaymentMethod" pm
WHERE r."paymentMethodId" IS NULL
  AND r."originAccountType"::text = pm."code";

UPDATE "Remittance" r
SET "receptionMethodId" = rm."id"
FROM "ReceptionMethodCatalog" rm
WHERE r."receptionMethodId" IS NULL
  AND r."receptionMethod"::text = rm."code";

UPDATE "Remittance" r
SET "currencyId" = c."id"
FROM "CurrencyCatalog" c
WHERE r."currencyId" IS NULL
  AND r."currency"::text = c."code";