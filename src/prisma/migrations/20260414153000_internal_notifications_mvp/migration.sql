-- CreateEnum
CREATE TYPE "InternalNotificationType" AS ENUM (
    'NEW_CLIENT',
    'NEW_REMITTANCE',
    'REMITTANCE_PENDING_PAYMENT',
    'REMITTANCE_PENDING_CONFIRMATION_PAYMENT',
    'REMITTANCE_PAYMENT_ACCEPTED_SENDING_RECEIVER',
    'REMITTANCE_COMPLETED',
    'REMITTANCE_CANCELLED_BY_ADMIN',
    'REMITTANCE_CANCELLED_BY_USER',
    'REMITTANCE_PAYMENT_ERROR',
    'ALERT_TRANSACTION_OVER_AMOUNT_LIMIT',
    'ALERT_USER_HAS_TOO_MANY_TRANSACTIONS_TODAY'
);

-- CreateTable
CREATE TABLE "InternalNotification" (
    "id" TEXT NOT NULL,
    "type" "InternalNotificationType" NOT NULL,
    "referenceId" TEXT,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InternalNotification_userId_createdAt_idx" ON "InternalNotification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InternalNotification_userId_isRead_createdAt_idx" ON "InternalNotification"("userId", "isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "InternalNotification"
ADD CONSTRAINT "InternalNotification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
