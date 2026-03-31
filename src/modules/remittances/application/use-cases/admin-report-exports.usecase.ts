import { Inject, Injectable } from '@nestjs/common';
import { AdminReportExportStatus } from '@prisma/client';
import { AppConfigService } from 'src/core/config/config.service';
import { ADMIN_REPORT_EXPORT_HISTORY_PORT } from 'src/shared/constants/tokens';
import { AdminReportExportDataset, AdminReportExportFormat } from '../../presentation/graphql/inputs/admin-transactions.input';
import {
  AdminReportExportHistoryPort,
  AdminReportExportRecord,
} from '../../domain/ports/admin-report-export-history.port';

export interface AdminReportExportHistoryItem {
  id: string;
  dataset: AdminReportExportDataset;
  format: AdminReportExportFormat;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: AdminReportExportStatus;
  expiresAt: Date;
  createdAt: Date;
  downloadUrl: string | null;
}

@Injectable()
export class AdminReportExportsUseCase {
  constructor(
    @Inject(ADMIN_REPORT_EXPORT_HISTORY_PORT)
    private readonly adminReportExportHistoryPort: AdminReportExportHistoryPort,
    private readonly config: AppConfigService,
  ) {}

  async execute(input: {
    dataset?: AdminReportExportDataset;
    format?: AdminReportExportFormat;
    status?: AdminReportExportStatus;
    limit?: number;
    offset?: number;
  }): Promise<AdminReportExportHistoryItem[]> {
    const now = new Date();
    await this.adminReportExportHistoryPort.markAllExpiredBefore({ now });

    const rows = await this.adminReportExportHistoryPort.list({
      dataset: input.dataset,
      format: input.format,
      status: input.status,
      limit: input.limit,
      offset: input.offset,
    });

    return rows.map((row) => this.toHistoryItem(row, now));
  }

  private toHistoryItem(row: AdminReportExportRecord, now: Date): AdminReportExportHistoryItem {
    const isDownloadAvailable = row.status === 'GENERATED' && row.expiresAt.getTime() > now.getTime();

    return {
      id: row.id,
      dataset: row.dataset as AdminReportExportDataset,
      format: row.format as AdminReportExportFormat,
      fileName: row.fileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      status: row.status,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      downloadUrl: isDownloadAvailable ? this.buildDownloadUrl(row.id) : null,
    };
  }

  private buildDownloadUrl(exportId: string): string {
    const normalizedBaseUrl = this.config.backendPublicBaseUrl.replace(/\/$/, '').replace(/\/api$/, '');
    return `${normalizedBaseUrl}/api/admin/report-exports/${exportId}/download`;
  }
}
