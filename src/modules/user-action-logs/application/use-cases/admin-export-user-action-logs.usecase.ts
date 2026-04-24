import { Inject, Injectable } from '@nestjs/common';
import { UserActionLogAction } from '@prisma/client';
import { USER_ACTION_LOG_QUERY_PORT } from 'src/shared/constants/tokens';
import { UserActionLogEntity } from '../../domain/entities/user-action-log.entity';
import { UserActionLogQueryPort } from '../../domain/ports/user-action-log-query.port';
import {
  assertValidAdminUserActionLogDateRange,
  resolveAdminUserActionLogExportPagination,
} from '../utils/admin-user-action-log-report-validation';

export type UserActionLogExportResult = {
  contentBase64: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  generatedAt: Date;
};

@Injectable()
export class AdminExportUserActionLogsUseCase {
  constructor(
    @Inject(USER_ACTION_LOG_QUERY_PORT)
    private readonly queryPort: UserActionLogQueryPort,
  ) {}

  async execute(input: {
    dateFrom: Date;
    dateTo: Date;
    actorUserId?: string;
    action?: UserActionLogAction;
    resourceType?: string;
    resourceId?: string;
    offset?: number;
    limit?: number;
  }): Promise<UserActionLogExportResult> {
    assertValidAdminUserActionLogDateRange(input);
    const pagination = resolveAdminUserActionLogExportPagination(input);
    const rows = await this.queryPort.listAdminForExport(input, pagination);
    const generatedAt = new Date();
    const content = this.renderCsv(rows);
    const buffer = Buffer.from(content, 'utf-8');

    return {
      contentBase64: buffer.toString('base64'),
      fileName: `user-action-logs-${this.formatForFileName(generatedAt)}.csv`,
      mimeType: 'text/csv; charset=utf-8',
      sizeBytes: buffer.byteLength,
      generatedAt,
    };
  }

  private renderCsv(rows: UserActionLogEntity[]): string {
    const headers = [
      'id',
      'createdAt',
      'actorUserId',
      'actorEmail',
      'actorRole',
      'action',
      'resourceType',
      'resourceId',
      'description',
      'metadataJson',
      'ipAddress',
      'userAgent',
    ];

    const lines = [headers.join(',')];

    for (const row of rows) {
      lines.push(
        [
          row.id,
          row.createdAt.toISOString(),
          row.actorUserId,
          row.actorEmail,
          row.actorRole,
          row.action,
          row.resourceType,
          row.resourceId,
          row.description,
          row.metadataJson,
          row.ipAddress,
          row.userAgent,
        ]
          .map((value) => this.escapeCsvValue(value))
          .join(','),
      );
    }

    return lines.join('\n');
  }

  private escapeCsvValue(value: string | null): string {
    const normalized = value ?? '';
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  private formatForFileName(value: Date): string {
    return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }
}