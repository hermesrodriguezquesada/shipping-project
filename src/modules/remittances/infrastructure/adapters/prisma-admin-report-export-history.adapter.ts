import { Injectable } from '@nestjs/common';
import { AdminReportExportStatus } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  AdminReportExportHistoryPort,
  AdminReportExportRecord,
  CreateAdminReportExportInput,
  ListAdminReportExportsInput,
} from '../../domain/ports/admin-report-export-history.port';

@Injectable()
export class PrismaAdminReportExportHistoryAdapter implements AdminReportExportHistoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAdminReportExportInput): Promise<AdminReportExportRecord> {
    const created = await this.prisma.adminReportExport.create({
      data: {
        id: input.id,
        requestedByUserId: input.requestedByUserId,
        dataset: input.dataset,
        format: input.format,
        filtersJson: input.filtersJson,
        status: (input.status ?? 'GENERATED') as AdminReportExportStatus,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storagePath: input.storagePath,
        expiresAt: input.expiresAt,
      },
    });

    return this.toRecord(created);
  }

  async findById(input: { id: string }): Promise<AdminReportExportRecord | null> {
    const found = await this.prisma.adminReportExport.findUnique({
      where: { id: input.id },
    });

    return found ? this.toRecord(found) : null;
  }

  async list(input: ListAdminReportExportsInput): Promise<AdminReportExportRecord[]> {
    const rows = await this.prisma.adminReportExport.findMany({
      where: {
        dataset: input.dataset,
        format: input.format,
        status: input.status as AdminReportExportStatus | undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    });

    return rows.map((row) => this.toRecord(row));
  }

  async markExpired(input: { id: string }): Promise<void> {
    await this.prisma.adminReportExport.updateMany({
      where: {
        id: input.id,
        status: 'GENERATED',
      },
      data: {
        status: 'EXPIRED',
      },
    });
  }

  async markAllExpiredBefore(input: { now: Date }): Promise<void> {
    await this.prisma.adminReportExport.updateMany({
      where: {
        status: 'GENERATED',
        expiresAt: {
          lte: input.now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });
  }

  private toRecord(row: {
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
  }): AdminReportExportRecord {
    return {
      id: row.id,
      requestedByUserId: row.requestedByUserId,
      dataset: row.dataset,
      format: row.format,
      filtersJson: row.filtersJson,
      status: row.status,
      fileName: row.fileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      storagePath: row.storagePath,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
