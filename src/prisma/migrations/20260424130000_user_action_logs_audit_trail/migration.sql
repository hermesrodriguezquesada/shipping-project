-- CreateEnum
CREATE TYPE "UserActionLogAction" AS ENUM (
    'REGISTER',
    'LOGIN',
    'LOGOUT',
    'UPDATE_PROFILE',
    'ADMIN_UPDATE_USER',
    'ADMIN_SET_USER_VIP',
    'CREATE_REMITTANCE',
    'MARK_REMITTANCE_PAID',
    'ADMIN_CONFIRM_REMITTANCE_PAYMENT',
    'ADMIN_MARK_REMITTANCE_DELIVERED',
    'CANCEL_REMITTANCE',
    'CREATE_VIP_PAYMENT_PROOF',
    'ADMIN_CONFIRM_VIP_PAYMENT_PROOF',
    'ADMIN_CANCEL_VIP_PAYMENT_PROOF',
    'CREATE_SUPPORT_MESSAGE',
    'ANSWER_SUPPORT_MESSAGE'
);

-- CreateTable
CREATE TABLE "UserActionLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" "UserActionLogAction" NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "description" TEXT,
    "metadataJson" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserActionLog_actorUserId_idx" ON "UserActionLog"("actorUserId");

-- CreateIndex
CREATE INDEX "UserActionLog_action_idx" ON "UserActionLog"("action");

-- CreateIndex
CREATE INDEX "UserActionLog_resourceType_resourceId_idx" ON "UserActionLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "UserActionLog_createdAt_idx" ON "UserActionLog"("createdAt");

-- AddForeignKey
ALTER TABLE "UserActionLog"
ADD CONSTRAINT "UserActionLog_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;