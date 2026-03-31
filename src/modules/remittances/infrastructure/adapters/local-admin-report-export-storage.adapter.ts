import { Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { AppConfigService } from 'src/core/config/config.service';
import { AdminReportExportStoragePort } from '../../domain/ports/admin-report-export-storage.port';

@Injectable()
export class LocalAdminReportExportStorageAdapter implements AdminReportExportStoragePort {
  constructor(private readonly config: AppConfigService) {}

  async store(input: { exportId: string; fileName: string; buffer: Buffer }): Promise<{ storagePath: string }> {
    const safeBaseName = basename(input.fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const extension = extname(safeBaseName);
    const storageFileName = extension
      ? `${input.exportId}${extension}`
      : `${input.exportId}.bin`;

    await fs.mkdir(this.config.adminReportExportsDir, { recursive: true });
    const absolutePath = join(this.config.adminReportExportsDir, storageFileName);
    await fs.writeFile(absolutePath, input.buffer);

    return {
      storagePath: storageFileName,
    };
  }

  async read(input: { storagePath: string }): Promise<Buffer> {
    const safeStoragePath = basename(input.storagePath);
    const absolutePath = join(this.config.adminReportExportsDir, safeStoragePath);
    return fs.readFile(absolutePath);
  }
}
