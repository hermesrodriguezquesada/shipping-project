import { Inject, Injectable } from '@nestjs/common';
import { RemittanceStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import * as XLSX from 'xlsx';
import { AppConfigService } from 'src/core/config/config.service';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  ADMIN_REPORT_EXPORT_HISTORY_PORT,
  ADMIN_REPORT_EXPORT_STORAGE_PORT,
} from 'src/shared/constants/tokens';
import { RemittanceReadModel, TransactionsPeriodGrouping } from '../../domain/ports/remittance-query.port';
import { AdminReportExportHistoryPort } from '../../domain/ports/admin-report-export-history.port';
import { AdminReportExportStoragePort } from '../../domain/ports/admin-report-export-storage.port';
import {
  AdminReportExportDataset,
  AdminReportExportFormat,
  AdminReportGrouping,
} from '../../presentation/graphql/inputs/admin-transactions.input';
import { AdminDashboardSummaryUseCase } from './admin-dashboard-summary.usecase';
import { AdminPaymentMethodUsageMetricsUseCase } from './admin-payment-method-usage-metrics.usecase';
import { AdminTransactionsAmountStatsUseCase } from './admin-transactions-amount-stats.usecase';
import { AdminTransactionsPeriodReportUseCase } from './admin-transactions-period-report.usecase';
import { AdminTransactionsUseCase } from './admin-transactions.usecase';

interface ExportTable {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface AdminReportExportResult {
  exportId: string;
  downloadUrl: string;
  expiresAt: Date;
  dataset: AdminReportExportDataset;
  format: AdminReportExportFormat;
  fileName: string;
  mimeType: string;
  contentBase64: string;
  sizeBytes: number;
  generatedAt: Date;
}

@Injectable()
export class AdminExportReportUseCase {
  private static readonly PDF_ENCODING: BufferEncoding = 'latin1';

  constructor(
    private readonly adminDashboardSummaryUseCase: AdminDashboardSummaryUseCase,
    private readonly adminTransactionsUseCase: AdminTransactionsUseCase,
    private readonly adminTransactionsPeriodReportUseCase: AdminTransactionsPeriodReportUseCase,
    private readonly adminTransactionsAmountStatsUseCase: AdminTransactionsAmountStatsUseCase,
    private readonly adminPaymentMethodUsageMetricsUseCase: AdminPaymentMethodUsageMetricsUseCase,
    @Inject(ADMIN_REPORT_EXPORT_HISTORY_PORT)
    private readonly adminReportExportHistoryPort: AdminReportExportHistoryPort,
    @Inject(ADMIN_REPORT_EXPORT_STORAGE_PORT)
    private readonly adminReportExportStoragePort: AdminReportExportStoragePort,
    private readonly config: AppConfigService,
  ) {}

  async execute(input: {
    requestedByUserId: string;
    dataset: AdminReportExportDataset;
    format: AdminReportExportFormat;
    dateFrom: Date;
    dateTo: Date;
    grouping?: AdminReportGrouping;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
    offset?: number;
    limit?: number;
    topPaymentMethodsLimit?: number;
  }): Promise<AdminReportExportResult> {
    if (input.dateFrom > input.dateTo) {
      throw new ValidationDomainException('dateFrom must be less than or equal to dateTo');
    }

    const generatedAt = new Date();
    const table = await this.buildDatasetTable(input);
    const rendered = this.render(table, input.format);
    const timestamp = this.formatForFileName(generatedAt);
    const exportId = randomUUID();
    const ttlHours = Math.max(1, this.config.adminReportExportTtlHours);
    const expiresAt = new Date(generatedAt.getTime() + ttlHours * 60 * 60 * 1000);
    const fileName = `${input.dataset.toLowerCase()}-${timestamp}${rendered.extension}`;

    const storage = await this.adminReportExportStoragePort.store({
      exportId,
      fileName,
      buffer: rendered.buffer,
    });

    await this.adminReportExportHistoryPort.create({
      id: exportId,
      requestedByUserId: input.requestedByUserId,
      dataset: input.dataset,
      format: input.format,
      filtersJson: this.serializeFilters(input),
      status: 'GENERATED',
      fileName,
      mimeType: rendered.mimeType,
      sizeBytes: rendered.buffer.byteLength,
      storagePath: storage.storagePath,
      expiresAt,
    });

    return {
      exportId,
      downloadUrl: this.buildDownloadUrl(exportId),
      expiresAt,
      dataset: input.dataset,
      format: input.format,
      fileName,
      mimeType: rendered.mimeType,
      contentBase64: rendered.buffer.toString('base64'),
      sizeBytes: rendered.buffer.byteLength,
      generatedAt,
    };
  }

  private async buildDatasetTable(input: {
    dataset: AdminReportExportDataset;
    format: AdminReportExportFormat;
    dateFrom: Date;
    dateTo: Date;
    grouping?: AdminReportGrouping;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
    offset?: number;
    limit?: number;
    topPaymentMethodsLimit?: number;
  }): Promise<ExportTable> {
    switch (input.dataset) {
      case AdminReportExportDataset.DASHBOARD_SUMMARY:
        return this.buildDashboardSummaryTable(input);
      case AdminReportExportDataset.TRANSACTIONS:
        return this.buildTransactionsTable(input);
      case AdminReportExportDataset.PERIOD_REPORT:
        return this.buildPeriodReportTable(input);
      case AdminReportExportDataset.AMOUNT_STATS:
        return this.buildAmountStatsTable(input);
      case AdminReportExportDataset.PAYMENT_METHOD_USAGE:
        return this.buildPaymentMethodUsageTable(input);
      default:
        throw new ValidationDomainException('Unsupported dataset');
    }
  }

  private async buildDashboardSummaryTable(input: {
    dateFrom: Date;
    dateTo: Date;
    grouping?: AdminReportGrouping;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
    topPaymentMethodsLimit?: number;
  }): Promise<ExportTable> {
    const grouping = this.requireGrouping(input.grouping, AdminReportExportDataset.DASHBOARD_SUMMARY);
    const summary = await this.adminDashboardSummaryUseCase.execute({
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      grouping: grouping as TransactionsPeriodGrouping,
      status: input.status,
      userId: input.userId,
      paymentMethodCode: input.paymentMethodCode,
      topPaymentMethodsLimit: input.topPaymentMethodsLimit,
    });

    const rows: string[][] = [
      ['kpi', 'totalTransactions', `${summary.kpis.totalTransactions}`],
      ['kpi', 'totalPaymentAmount', summary.kpis.totalPaymentAmount],
      ['kpi', 'totalReceivingAmount', summary.kpis.totalReceivingAmount],
    ];

    for (const bucket of summary.periodTrend) {
      rows.push([
        'periodTrend',
        bucket.periodStart.toISOString(),
        bucket.periodEnd.toISOString(),
        `${bucket.transactionCount}`,
        bucket.timezone,
      ]);
    }

    for (const metric of summary.topPaymentMethods) {
      rows.push([
        'topPaymentMethod',
        metric.paymentMethodCode ?? '',
        metric.paymentMethodName ?? '',
        `${metric.usageCount}`,
        metric.totalPaymentAmount.toString(),
      ]);
    }

    return {
      title: 'Dashboard Summary Report',
      headers: ['section', 'col1', 'col2', 'col3', 'col4'],
      rows,
    };
  }

  private async buildTransactionsTable(input: {
    dateFrom: Date;
    dateTo: Date;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
    offset?: number;
    limit?: number;
  }): Promise<ExportTable> {
    const limit = input.limit ?? 200;
    if (limit < 1 || limit > 500) {
      throw new ValidationDomainException('limit must be between 1 and 500');
    }

    const remittances = await this.adminTransactionsUseCase.execute({
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      status: input.status,
      userId: input.userId,
      paymentMethodCode: input.paymentMethodCode,
      offset: input.offset,
      limit,
    });

    return {
      title: 'Transactions Report',
      headers: [
        'id',
        'status',
        'ownerEmail',
        'beneficiaryFullName',
        'paymentMethodCode',
        'paymentAmount',
        'receivingAmount',
        'paymentCurrencyCode',
        'receivingCurrencyCode',
        'createdAt',
      ],
      rows: remittances.map((item) => this.toTransactionRow(item)),
    };
  }

  private async buildPeriodReportTable(input: {
    dateFrom: Date;
    dateTo: Date;
    grouping?: AdminReportGrouping;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
  }): Promise<ExportTable> {
    const grouping = this.requireGrouping(input.grouping, AdminReportExportDataset.PERIOD_REPORT);
    const buckets = await this.adminTransactionsPeriodReportUseCase.execute({
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      grouping: grouping as TransactionsPeriodGrouping,
      status: input.status,
      userId: input.userId,
      paymentMethodCode: input.paymentMethodCode,
    });

    return {
      title: 'Period Report',
      headers: ['periodStart', 'periodEnd', 'transactionCount', 'timezone'],
      rows: buckets.map((bucket) => [
        bucket.periodStart.toISOString(),
        bucket.periodEnd.toISOString(),
        `${bucket.transactionCount}`,
        bucket.timezone,
      ]),
    };
  }

  private async buildAmountStatsTable(input: {
    dateFrom: Date;
    dateTo: Date;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
  }): Promise<ExportTable> {
    const stats = await this.adminTransactionsAmountStatsUseCase.execute({
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      status: input.status,
      userId: input.userId,
      paymentMethodCode: input.paymentMethodCode,
    });

    return {
      title: 'Amount Stats Report',
      headers: ['metric', 'value'],
      rows: [
        ['remittanceCount', `${stats.remittanceCount}`],
        ['totalPaymentAmount', stats.totalPaymentAmount.toString()],
        ['totalReceivingAmount', stats.totalReceivingAmount.toString()],
      ],
    };
  }

  private async buildPaymentMethodUsageTable(input: {
    dateFrom: Date;
    dateTo: Date;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
  }): Promise<ExportTable> {
    const metrics = await this.adminPaymentMethodUsageMetricsUseCase.execute({
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      status: input.status,
      userId: input.userId,
      paymentMethodCode: input.paymentMethodCode,
    });

    return {
      title: 'Payment Method Usage Report',
      headers: ['paymentMethodCode', 'paymentMethodName', 'usageCount', 'totalPaymentAmount'],
      rows: metrics.map((metric) => [
        metric.paymentMethodCode ?? '',
        metric.paymentMethodName ?? '',
        `${metric.usageCount}`,
        metric.totalPaymentAmount.toString(),
      ]),
    };
  }

  private render(table: ExportTable, format: AdminReportExportFormat): {
    buffer: Buffer;
    mimeType: string;
    extension: string;
  } {
    if (format === AdminReportExportFormat.CSV) {
      const content = [table.headers, ...table.rows]
        .map((row) => row.map((cell) => this.escapeCsv(cell)).join(','))
        .join('\n');
      return {
        buffer: Buffer.from(content, 'utf-8'),
        mimeType: 'text/csv; charset=utf-8',
        extension: '.csv',
      };
    }

    if (format === AdminReportExportFormat.EXCEL) {
      const worksheet = XLSX.utils.aoa_to_sheet([table.headers, ...table.rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, this.buildSheetName(table.title));

      const buffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
        compression: true,
      }) as Buffer;

      return {
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: '.xlsx',
      };
    }

    const pdfLines = [table.title, '', ...table.headers.join(' | ').split('\n')];
    for (const row of table.rows) {
      pdfLines.push(row.join(' | '));
    }

    return {
      buffer: this.buildPdf(pdfLines),
      mimeType: 'application/pdf',
      extension: '.pdf',
    };
  }

  private toTransactionRow(item: RemittanceReadModel): string[] {
    return [
      item.id,
      item.status,
      item.sender.email,
      item.beneficiary.fullName,
      item.paymentMethod?.code ?? '',
      item.amount.toString(),
      item.netReceivingAmount?.toString() ?? '',
      item.paymentCurrency?.code ?? '',
      item.receivingCurrency?.code ?? '',
      item.createdAt.toISOString(),
    ];
  }

  private requireGrouping(grouping: AdminReportGrouping | undefined, dataset: AdminReportExportDataset): AdminReportGrouping {
    if (!grouping) {
      throw new ValidationDomainException(`grouping is required for dataset ${dataset}`);
    }

    return grouping;
  }

  private formatForFileName(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }

  private escapeCsv(value: string): string {
    const normalized = value ?? '';
    if (/[",\n]/.test(normalized)) {
      return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
  }

  private buildSheetName(title: string): string {
    const normalized = title.replace(/[\\\/?*\[\]:]/g, ' ').trim();
    if (!normalized) {
      return 'Report';
    }

    return normalized.slice(0, 31);
  }

  private buildPdf(lines: string[]): Buffer {
    const streamContent = this.buildTextStream(lines);

    const objects = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
      `4 0 obj\n<< /Length ${Buffer.byteLength(streamContent, AdminExportReportUseCase.PDF_ENCODING)} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];

    for (const objectContent of objects) {
      offsets.push(Buffer.byteLength(pdf, AdminExportReportUseCase.PDF_ENCODING));
      pdf += objectContent;
    }

    const xrefOffset = Buffer.byteLength(pdf, AdminExportReportUseCase.PDF_ENCODING);

    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';

    for (const offset of offsets) {
      pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(pdf, AdminExportReportUseCase.PDF_ENCODING);
  }

  private buildTextStream(lines: string[]): string {
    const streamLines: string[] = ['BT', '/F1 10 Tf', '50 800 Td', '12 TL'];

    lines.slice(0, 120).forEach((line, index) => {
      if (index > 0) {
        streamLines.push('T*');
      }
      streamLines.push(`(${this.escapePdfText(line)}) Tj`);
    });

    streamLines.push('ET');

    return streamLines.join('\n');
  }

  private escapePdfText(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  private serializeFilters(input: {
    dataset: AdminReportExportDataset;
    format: AdminReportExportFormat;
    dateFrom: Date;
    dateTo: Date;
    grouping?: AdminReportGrouping;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
    offset?: number;
    limit?: number;
    topPaymentMethodsLimit?: number;
  }): string {
    return JSON.stringify({
      dataset: input.dataset,
      format: input.format,
      dateFrom: input.dateFrom.toISOString(),
      dateTo: input.dateTo.toISOString(),
      grouping: input.grouping,
      status: input.status,
      userId: input.userId,
      paymentMethodCode: input.paymentMethodCode,
      offset: input.offset,
      limit: input.limit,
      topPaymentMethodsLimit: input.topPaymentMethodsLimit,
    });
  }

  private buildDownloadUrl(exportId: string): string {
    const normalizedBaseUrl = this.config.backendPublicBaseUrl.replace(/\/$/, '').replace(/\/api$/, '');
    return `${normalizedBaseUrl}/api/admin/report-exports/${exportId}/download`;
  }
}