ALTER TABLE "Remittance"
  ADD COLUMN IF NOT EXISTS "paymentProofKey" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentProofFileName" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentProofMimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentProofSizeBytes" INTEGER,
  ADD COLUMN IF NOT EXISTS "paymentProofUploadedAt" TIMESTAMP(3);
