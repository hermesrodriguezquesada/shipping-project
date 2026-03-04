ALTER TABLE "Remittance"
  ADD COLUMN "recipientFullName" TEXT,
  ADD COLUMN "recipientPhone" TEXT,
  ADD COLUMN "recipientCountry" TEXT,
  ADD COLUMN "recipientAddressLine1" TEXT,
  ADD COLUMN "recipientDocumentNumber" TEXT,
  ADD COLUMN "recipientEmail" TEXT,
  ADD COLUMN "recipientCity" TEXT,
  ADD COLUMN "recipientAddressLine2" TEXT,
  ADD COLUMN "recipientPostalCode" TEXT,
  ADD COLUMN "recipientDocumentType" "DocumentType",
  ADD COLUMN "recipientRelationship" "BeneficiaryRelationship",
  ADD COLUMN "recipientDeliveryInstructions" TEXT;

UPDATE "Remittance" r
SET
  "recipientFullName" = b."fullName",
  "recipientPhone" = b."phone",
  "recipientCountry" = b."country",
  "recipientCity" = b."city",
  "recipientAddressLine1" = b."addressLine1",
  "recipientAddressLine2" = b."addressLine2",
  "recipientPostalCode" = b."postalCode",
  "recipientDocumentType" = b."documentType",
  "recipientDocumentNumber" = b."documentNumber",
  "recipientRelationship" = b."relationship",
  "recipientDeliveryInstructions" = b."deliveryInstructions",
  "recipientEmail" = b."email"
FROM "Beneficiary" b
WHERE r."beneficiaryId" = b."id";

DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO missing_count
  FROM "Remittance"
  WHERE
    "recipientFullName" IS NULL OR
    "recipientPhone" IS NULL OR
    "recipientCountry" IS NULL OR
    "recipientAddressLine1" IS NULL OR
    "recipientDocumentNumber" IS NULL;

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Backfill failed: % remittances still have null required recipient snapshot fields', missing_count;
  END IF;
END $$;

ALTER TABLE "Remittance"
  ALTER COLUMN "recipientFullName" SET NOT NULL,
  ALTER COLUMN "recipientPhone" SET NOT NULL,
  ALTER COLUMN "recipientCountry" SET NOT NULL,
  ALTER COLUMN "recipientAddressLine1" SET NOT NULL,
  ALTER COLUMN "recipientDocumentNumber" SET NOT NULL;
