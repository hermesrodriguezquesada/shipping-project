-- Introduce canonical origin account payload
ALTER TABLE "Remittance"
  ADD COLUMN IF NOT EXISTS "originAccountData" JSONB;

-- Backfill canonical payload from legacy remittance columns
UPDATE "Remittance"
SET "originAccountData" = NULLIF(
  jsonb_strip_nulls(
    jsonb_build_object(
      'zelleEmail', "originZelleEmail",
      'iban', "originIban",
      'stripePaymentMethodId', "originStripePaymentMethodId"
    )
  ),
  '{}'::jsonb
)
WHERE "originAccountData" IS NULL;

-- Seed strict metadata for platform payment methods
UPDATE "PaymentMethod"
SET "additionalData" = '{"schemaVersion":1,"allowedFields":["zelleEmail"],"requiredFields":["zelleEmail"],"fieldDefinitions":{"zelleEmail":{"type":"string","format":"email","required":true,"minLength":5,"maxLength":254}}}'
WHERE "code" = 'ZELLE';

UPDATE "PaymentMethod"
SET "additionalData" = '{"schemaVersion":1,"allowedFields":["iban"],"requiredFields":["iban"],"fieldDefinitions":{"iban":{"type":"string","format":"iban","required":true,"minLength":15,"maxLength":34}}}'
WHERE "code" = 'IBAN';

UPDATE "PaymentMethod"
SET "additionalData" = '{"schemaVersion":1,"allowedFields":["stripePaymentMethodId"],"requiredFields":["stripePaymentMethodId"],"fieldDefinitions":{"stripePaymentMethodId":{"type":"string","format":"token","required":true,"minLength":3,"maxLength":255}}}'
WHERE "code" = 'STRIPE';

-- Drop legacy origin account storage
ALTER TABLE "Remittance"
  DROP COLUMN IF EXISTS "originZelleEmail",
  DROP COLUMN IF EXISTS "originIban",
  DROP COLUMN IF EXISTS "originStripePaymentMethodId";
