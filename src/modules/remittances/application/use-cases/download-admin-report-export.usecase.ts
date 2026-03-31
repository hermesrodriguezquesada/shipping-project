import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_REPORT_EXPORT_HISTORY_PORT,
  ADMIN_REPORT_EXPORT_STORAGE_PORT,
} from 'src/shared/constants/tokens';
import { AdminReportExportHistoryPort } from '../../domain/ports/admin-report-export-history.port';
import { AdminReportExportStoragePort } from '../../domain/ports/admin-report-export-storage.port';

export class AdminReportExportNotFoundError extends Error {
  constructor(message = 'Admin report export not found') {
    super(message);
  }
}

export class AdminReportExportExpiredError extends Error {
  constructor(message = 'Admin report export has expired') {
    super(message);
  }
}

export class AdminReportExportFileUnavailableError extends Error {
  constructor(message = 'Admin report export file is unavailable') {
    super(message);
  }
}

@Injectable()
export class DownloadAdminReportExportUseCase {
  constructor(
    @Inject(ADMIN_REPORT_EXPORT_HISTORY_PORT)
    private readonly adminReportExportHistoryPort: AdminReportExportHistoryPort,
    @Inject(ADMIN_REPORT_EXPORT_STORAGE_PORT)
    private readonly adminReportExportStoragePort: AdminReportExportStoragePort,
  ) {}

  async execute(input: { id: string }): Promise<{ fileName: string; mimeType: string; fileBuffer: Buffer }> {
    const exportRecord = await this.adminReportExportHistoryPort.findById({ id: input.id });

    if (!exportRecord) {
      throw new AdminReportExportNotFoundError();
    }

    const now = new Date();
    const isExpired =
      exportRecord.status === 'EXPIRED' ||
      exportRecord.status === 'FAILED' ||
      exportRecord.expiresAt.getTime() <= now.getTime();

    if (isExpired) {
      await this.adminReportExportHistoryPort.markExpired({ id: exportRecord.id });
      throw new AdminReportExportExpiredError();
    }

    try {
      const fileBuffer = await this.adminReportExportStoragePort.read({
        storagePath: exportRecord.storagePath,
      });

      return {
        fileName: exportRecord.fileName,
        mimeType: exportRecord.mimeType,
        fileBuffer,
      };
    } catch {
      throw new AdminReportExportFileUnavailableError();
    }
  }
}
