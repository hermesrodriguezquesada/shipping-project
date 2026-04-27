-- CreateEnum
CREATE TYPE "UserActionAlertType" AS ENUM ('MANY_RECENT_LOGINS', 'MANY_REMITTANCE_CANCELLATIONS', 'SENSITIVE_ADMIN_ACTION');

-- CreateTable
CREATE TABLE "UserActionAlert" (
    "id" TEXT NOT NULL,
    "type" "UserActionAlertType" NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "description" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActionAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserActionAlert_type_idx" ON "UserActionAlert"("type");

-- CreateIndex
CREATE INDEX "UserActionAlert_actorUserId_idx" ON "UserActionAlert"("actorUserId");

-- CreateIndex
CREATE INDEX "UserActionAlert_createdAt_idx" ON "UserActionAlert"("createdAt");

-- AddForeignKey
ALTER TABLE "UserActionAlert" ADD CONSTRAINT "UserActionAlert_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;