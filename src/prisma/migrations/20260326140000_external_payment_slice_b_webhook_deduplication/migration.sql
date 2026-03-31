-- AddColumn for webhook tracking and deduplication
ALTER TABLE "ExternalPayment" ADD COLUMN "providerEventId" TEXT;
ALTER TABLE "ExternalPayment" ADD COLUMN "lastWebhookEventId" TEXT;
ALTER TABLE "ExternalPayment" ADD COLUMN "lastWebhookReceivedAt" TIMESTAMP(3);
ALTER TABLE "ExternalPayment" ADD COLUMN "acceptedAt" TIMESTAMP(3);

-- CreateIndex for webhook deduplication
CREATE UNIQUE INDEX "ExternalPayment_provider_providerEventId_key" ON "ExternalPayment"("provider", "providerEventId");
CREATE INDEX "ExternalPayment_lastWebhookEventId_idx" ON "ExternalPayment"("lastWebhookEventId");
