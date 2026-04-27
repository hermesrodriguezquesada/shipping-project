ALTER TABLE "UserActionLog"
ADD COLUMN "correlationId" TEXT;

CREATE INDEX "UserActionLog_correlationId_idx" ON "UserActionLog"("correlationId");