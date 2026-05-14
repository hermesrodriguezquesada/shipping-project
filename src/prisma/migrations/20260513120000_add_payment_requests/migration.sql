-- AlterEnum: add payment request action log values
ALTER TYPE "UserActionLogAction" ADD VALUE 'CREATE_PAYMENT_REQUEST';
ALTER TYPE "UserActionLogAction" ADD VALUE 'CLIENT_ACCEPT_PAYMENT_REQUEST';
ALTER TYPE "UserActionLogAction" ADD VALUE 'CLIENT_CANCEL_PAYMENT_REQUEST';
ALTER TYPE "UserActionLogAction" ADD VALUE 'ADMIN_RENEGOTIATE_PAYMENT_REQUEST';
ALTER TYPE "UserActionLogAction" ADD VALUE 'ADMIN_ACCEPT_PAYMENT_REQUEST';
ALTER TYPE "UserActionLogAction" ADD VALUE 'ADMIN_COMPLETE_PAYMENT_REQUEST';
ALTER TYPE "UserActionLogAction" ADD VALUE 'ADMIN_CANCEL_PAYMENT_REQUEST';

-- AlterEnum: add payment request notification types
ALTER TYPE "InternalNotificationType" ADD VALUE 'NEW_PAYMENT_REQUEST';
ALTER TYPE "InternalNotificationType" ADD VALUE 'PAYMENT_REQUEST_RENEGOTIATED';
ALTER TYPE "InternalNotificationType" ADD VALUE 'PAYMENT_REQUEST_ACCEPTED';
ALTER TYPE "InternalNotificationType" ADD VALUE 'PAYMENT_REQUEST_PAID';
ALTER TYPE "InternalNotificationType" ADD VALUE 'PAYMENT_REQUEST_CANCELED_BY_ADMIN';
ALTER TYPE "InternalNotificationType" ADD VALUE 'PAYMENT_REQUEST_CANCELED_BY_CLIENT';

-- CreateEnum: payment request status
CREATE TYPE "PaymentRequestStatus" AS ENUM (
  'REQUESTED',
  'RENEGOTIATING',
  'ACCEPTED',
  'PAID',
  'CANCELED_BY_ADMIN',
  'CANCELED_BY_CLIENT'
);

-- CreateEnum: payment request method
CREATE TYPE "PaymentRequestMethod" AS ENUM (
  'TRANSFER',
  'CASH'
);

-- CreateTable: payment_request
CREATE TABLE "PaymentRequest" (
    "id"             TEXT NOT NULL,
    "ownerUserId"    TEXT NOT NULL,
    "amount"         DECIMAL(65,30) NOT NULL,
    "currencyId"     TEXT NOT NULL,
    "exchangeRate"   DECIMAL(65,30) NOT NULL,
    "deliveryFee"    DECIMAL(65,30) NOT NULL DEFAULT 0,
    "amountToPay"    DECIMAL(65,30) NOT NULL,
    "method"         "PaymentRequestMethod" NOT NULL,
    "account"        TEXT,
    "address"        TEXT,
    "delivery"       BOOLEAN NOT NULL DEFAULT false,
    "newAmount"      DECIMAL(65,30),
    "status"         "PaymentRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "reviewedById"   TEXT,
    "reviewedAt"     TIMESTAMP(3),
    "paidById"       TEXT,
    "paidAt"         TIMESTAMP(3),
    "canceledReason" TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentRequest_ownerUserId_createdAt_idx" ON "PaymentRequest"("ownerUserId", "createdAt");
CREATE INDEX "PaymentRequest_status_createdAt_idx" ON "PaymentRequest"("status", "createdAt");
CREATE INDEX "PaymentRequest_ownerUserId_status_idx" ON "PaymentRequest"("ownerUserId", "status");

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_ownerUserId_fkey"
    FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_currencyId_fkey"
    FOREIGN KEY ("currencyId") REFERENCES "CurrencyCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_paidById_fkey"
    FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
