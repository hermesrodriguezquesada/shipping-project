-- CreateTable
CREATE TABLE "VipExchangeRate" (
    "id" TEXT NOT NULL,
    "fromCurrencyId" TEXT NOT NULL,
    "toCurrencyId" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VipExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VipExchangeRate_enabled_idx" ON "VipExchangeRate"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "VipExchangeRate_fromCurrencyId_toCurrencyId_key" ON "VipExchangeRate"("fromCurrencyId", "toCurrencyId");

-- AddForeignKey
ALTER TABLE "VipExchangeRate"
ADD CONSTRAINT "VipExchangeRate_fromCurrencyId_fkey"
FOREIGN KEY ("fromCurrencyId") REFERENCES "CurrencyCatalog"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VipExchangeRate"
ADD CONSTRAINT "VipExchangeRate_toCurrencyId_fkey"
FOREIGN KEY ("toCurrencyId") REFERENCES "CurrencyCatalog"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;