-- AlterTable
ALTER TABLE "Remittance" ADD COLUMN     "commissionAmount" DECIMAL(65,30),
ADD COLUMN     "commissionCurrencyIdUsed" TEXT,
ADD COLUMN     "commissionRuleIdUsed" TEXT,
ADD COLUMN     "commissionRuleVersionUsed" INTEGER,
ADD COLUMN     "deliveryFeeAmount" DECIMAL(65,30),
ADD COLUMN     "deliveryFeeCurrencyIdUsed" TEXT,
ADD COLUMN     "deliveryFeeRuleIdUsed" TEXT,
ADD COLUMN     "netReceivingAmount" DECIMAL(65,30),
ADD COLUMN     "netReceivingCurrencyIdUsed" TEXT;

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "holderType" "OriginAccountHolderType" NOT NULL,
    "version" INTEGER NOT NULL,
    "thresholdAmount" DECIMAL(65,30) NOT NULL,
    "percentRate" DECIMAL(65,30) NOT NULL,
    "flatFee" DECIMAL(65,30) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryFeeRule" (
    "id" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "city" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryFeeRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommissionRule_currencyId_holderType_enabled_version_idx" ON "CommissionRule"("currencyId", "holderType", "enabled", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionRule_currencyId_holderType_version_key" ON "CommissionRule"("currencyId", "holderType", "version");

-- CreateIndex
CREATE INDEX "DeliveryFeeRule_currencyId_country_region_city_enabled_idx" ON "DeliveryFeeRule"("currencyId", "country", "region", "city", "enabled");

-- CreateIndex
CREATE INDEX "Remittance_commissionRuleIdUsed_idx" ON "Remittance"("commissionRuleIdUsed");

-- CreateIndex
CREATE INDEX "Remittance_deliveryFeeRuleIdUsed_idx" ON "Remittance"("deliveryFeeRuleIdUsed");

-- CreateIndex
CREATE INDEX "Remittance_commissionCurrencyIdUsed_idx" ON "Remittance"("commissionCurrencyIdUsed");

-- CreateIndex
CREATE INDEX "Remittance_deliveryFeeCurrencyIdUsed_idx" ON "Remittance"("deliveryFeeCurrencyIdUsed");

-- CreateIndex
CREATE INDEX "Remittance_netReceivingCurrencyIdUsed_idx" ON "Remittance"("netReceivingCurrencyIdUsed");

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "CurrencyCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryFeeRule" ADD CONSTRAINT "DeliveryFeeRule_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "CurrencyCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remittance" ADD CONSTRAINT "Remittance_commissionCurrencyIdUsed_fkey" FOREIGN KEY ("commissionCurrencyIdUsed") REFERENCES "CurrencyCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remittance" ADD CONSTRAINT "Remittance_deliveryFeeCurrencyIdUsed_fkey" FOREIGN KEY ("deliveryFeeCurrencyIdUsed") REFERENCES "CurrencyCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remittance" ADD CONSTRAINT "Remittance_netReceivingCurrencyIdUsed_fkey" FOREIGN KEY ("netReceivingCurrencyIdUsed") REFERENCES "CurrencyCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remittance" ADD CONSTRAINT "Remittance_commissionRuleIdUsed_fkey" FOREIGN KEY ("commissionRuleIdUsed") REFERENCES "CommissionRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remittance" ADD CONSTRAINT "Remittance_deliveryFeeRuleIdUsed_fkey" FOREIGN KEY ("deliveryFeeRuleIdUsed") REFERENCES "DeliveryFeeRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
