-- CreateEnum
CREATE TYPE "ExternalPaymentProvider" AS ENUM ('STRIPE');

-- CreateEnum
CREATE TYPE "ExternalPaymentStatus" AS ENUM ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ExternalPayment" (
  "id" TEXT NOT NULL,
  "remittanceId" TEXT NOT NULL,
  "provider" "ExternalPaymentProvider" NOT NULL,
  "providerPaymentId" TEXT,
  "providerSessionId" TEXT,
  "checkoutUrl" TEXT,
  "status" "ExternalPaymentStatus" NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "currencyCode" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "metadataJson" JSONB,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalPayment_idempotencyKey_key" ON "ExternalPayment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalPayment_provider_providerPaymentId_key" ON "ExternalPayment"("provider", "providerPaymentId");

-- CreateIndex
CREATE INDEX "ExternalPayment_remittanceId_idx" ON "ExternalPayment"("remittanceId");

-- CreateIndex
CREATE INDEX "ExternalPayment_provider_status_idx" ON "ExternalPayment"("provider", "status");

-- AddForeignKey
ALTER TABLE "ExternalPayment"
  ADD CONSTRAINT "ExternalPayment_remittanceId_fkey"
  FOREIGN KEY ("remittanceId") REFERENCES "Remittance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
