-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('PERSON', 'COMPANY');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "clientType" "ClientType",
ADD COLUMN "companyName" TEXT;

-- Backfill existing rows deterministically
UPDATE "User"
SET "clientType" = 'PERSON'::"ClientType"
WHERE "clientType" IS NULL;

-- Enforce required column and default for new rows
ALTER TABLE "User"
ALTER COLUMN "clientType" SET DEFAULT 'PERSON',
ALTER COLUMN "clientType" SET NOT NULL;
