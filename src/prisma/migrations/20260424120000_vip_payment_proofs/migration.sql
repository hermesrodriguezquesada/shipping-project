-- CreateEnum
CREATE TYPE "VipPaymentProofStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELED');

-- CreateTable
CREATE TABLE "VipPaymentProof" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currencyId" TEXT NOT NULL,
    "paymentProofKey" TEXT NOT NULL,
    "status" "VipPaymentProofStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "cancelReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VipPaymentProof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VipPaymentProof_userId_idx" ON "VipPaymentProof"("userId");

-- CreateIndex
CREATE INDEX "VipPaymentProof_status_idx" ON "VipPaymentProof"("status");

-- CreateIndex
CREATE INDEX "VipPaymentProof_currencyId_idx" ON "VipPaymentProof"("currencyId");

-- CreateIndex
CREATE INDEX "VipPaymentProof_createdAt_idx" ON "VipPaymentProof"("createdAt");

-- CreateIndex
CREATE INDEX "VipPaymentProof_reviewedById_idx" ON "VipPaymentProof"("reviewedById");

-- AddForeignKey
ALTER TABLE "VipPaymentProof"
ADD CONSTRAINT "VipPaymentProof_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VipPaymentProof"
ADD CONSTRAINT "VipPaymentProof_currencyId_fkey"
FOREIGN KEY ("currencyId") REFERENCES "CurrencyCatalog"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VipPaymentProof"
ADD CONSTRAINT "VipPaymentProof_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;