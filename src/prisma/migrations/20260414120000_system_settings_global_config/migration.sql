-- CreateEnum
CREATE TYPE "SystemSettingType" AS ENUM ('STRING', 'EMAIL', 'NUMBER', 'BOOLEAN', 'URL', 'PASSWORD');

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SystemSettingType" NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_name_key" ON "SystemSetting"("name");

-- CreateIndex
CREATE INDEX "SystemSetting_type_idx" ON "SystemSetting"("type");
