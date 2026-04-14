-- CreateEnum
CREATE TYPE "SupportMessageStatus" AS ENUM ('OPEN', 'ANSWERED');

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "answer" TEXT,
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3),
    "status" "SupportMessageStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportMessage_authorId_createdAt_idx" ON "SupportMessage"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_status_createdAt_idx" ON "SupportMessage"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_answeredById_idx" ON "SupportMessage"("answeredById");

-- AddForeignKey
ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_answeredById_fkey"
FOREIGN KEY ("answeredById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
