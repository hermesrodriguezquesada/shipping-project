-- CreateEnum
CREATE TYPE "AdminReportExportStatus" AS ENUM ('GENERATED', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "AdminReportExport" (
  "id" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "dataset" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "filtersJson" TEXT,
  "status" "AdminReportExportStatus" NOT NULL DEFAULT 'GENERATED',
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "storagePath" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminReportExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminReportExport_requestedByUserId_idx" ON "AdminReportExport"("requestedByUserId");

-- CreateIndex
CREATE INDEX "AdminReportExport_status_createdAt_idx" ON "AdminReportExport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AdminReportExport_expiresAt_idx" ON "AdminReportExport"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminReportExport_dataset_format_idx" ON "AdminReportExport"("dataset", "format");
