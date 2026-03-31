export type AdminReportExportStatus = 'GENERATED' | 'EXPIRED' | 'FAILED';

export interface AdminReportExportRecord {
  id: string;
  requestedByUserId: string;
  dataset: string;
  format: string;
  filtersJson: string | null;
  status: AdminReportExportStatus;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdminReportExportInput {
  id: string;
  requestedByUserId: string;
  dataset: string;
  format: string;
  filtersJson: string | null;
  status?: AdminReportExportStatus;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  expiresAt: Date;
}

export interface ListAdminReportExportsInput {
  dataset?: string;
  format?: string;
  status?: AdminReportExportStatus;
  limit?: number;
  offset?: number;
}

export interface AdminReportExportHistoryPort {
  create(input: CreateAdminReportExportInput): Promise<AdminReportExportRecord>;
  findById(input: { id: string }): Promise<AdminReportExportRecord | null>;
  list(input: ListAdminReportExportsInput): Promise<AdminReportExportRecord[]>;
  markExpired(input: { id: string }): Promise<void>;
  markAllExpiredBefore(input: { now: Date }): Promise<void>;
}
