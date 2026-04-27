-- CreateEnum
CREATE TYPE "ExchangeRateHistoryType" AS ENUM ('GENERAL', 'VIP');

-- CreateEnum
CREATE TYPE "ExchangeRateHistoryVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "ExchangeRateHistory" (
    "id" TEXT NOT NULL,
    "rateType" "ExchangeRateHistoryType" NOT NULL,
    "visibility" "ExchangeRateHistoryVisibility" NOT NULL DEFAULT 'PRIVATE',
    "sourceRateId" TEXT,
    "fromCurrencyId" TEXT,
    "toCurrencyId" TEXT,
    "fromCurrencyCode" TEXT NOT NULL,
    "toCurrencyCode" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExchangeRateHistory_visibility_rateType_createdAt_idx" ON "ExchangeRateHistory"("visibility", "rateType", "createdAt");

-- CreateIndex
CREATE INDEX "ExchangeRateHistory_rateType_fromCurrencyCode_createdAt_idx" ON "ExchangeRateHistory"("rateType", "fromCurrencyCode", "createdAt");

-- CreateIndex
CREATE INDEX "ExchangeRateHistory_rateType_toCurrencyCode_createdAt_idx" ON "ExchangeRateHistory"("rateType", "toCurrencyCode", "createdAt");

-- CreateIndex
CREATE INDEX "ExchangeRateHistory_rateType_fromCurrencyCode_toCurrencyCode_createdAt_idx" ON "ExchangeRateHistory"("rateType", "fromCurrencyCode", "toCurrencyCode", "createdAt");