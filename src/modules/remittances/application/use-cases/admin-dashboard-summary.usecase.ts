import { Injectable } from '@nestjs/common';
import { RemittanceStatus } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { PaymentMethodUsageMetricReadModel, TransactionsPeriodBucketReadModel, TransactionsPeriodGrouping } from '../../domain/ports/remittance-query.port';
import { AdminPaymentMethodUsageMetricsUseCase } from './admin-payment-method-usage-metrics.usecase';
import { AdminTransactionsAmountStatsUseCase } from './admin-transactions-amount-stats.usecase';
import { AdminTransactionsPeriodReportUseCase } from './admin-transactions-period-report.usecase';

export interface AdminDashboardSummaryReadModel {
  kpis: {
    totalTransactions: number;
    totalPaymentAmount: string;
    totalReceivingAmount: string;
  };
  periodTrend: TransactionsPeriodBucketReadModel[];
  topPaymentMethods: PaymentMethodUsageMetricReadModel[];
  period: {
    dateFrom: Date;
    dateTo: Date;
    grouping: TransactionsPeriodGrouping;
  };
  timezone: string;
}

@Injectable()
export class AdminDashboardSummaryUseCase {
  constructor(
    private readonly adminTransactionsAmountStatsUseCase: AdminTransactionsAmountStatsUseCase,
    private readonly adminTransactionsPeriodReportUseCase: AdminTransactionsPeriodReportUseCase,
    private readonly adminPaymentMethodUsageMetricsUseCase: AdminPaymentMethodUsageMetricsUseCase,
  ) {}

  async execute(input: {
    dateFrom: Date;
    dateTo: Date;
    grouping: TransactionsPeriodGrouping;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
    topPaymentMethodsLimit?: number;
  }): Promise<AdminDashboardSummaryReadModel> {
    if (input.dateFrom > input.dateTo) {
      throw new ValidationDomainException('dateFrom must be less than or equal to dateTo');
    }

    const topPaymentMethodsLimit = input.topPaymentMethodsLimit ?? 5;
    if (topPaymentMethodsLimit < 1 || topPaymentMethodsLimit > 20) {
      throw new ValidationDomainException('topPaymentMethodsLimit must be between 1 and 20');
    }

    const [stats, periodTrend, paymentMethodMetrics] = await Promise.all([
      this.adminTransactionsAmountStatsUseCase.execute({
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        status: input.status,
        userId: input.userId,
        paymentMethodCode: input.paymentMethodCode,
      }),
      this.adminTransactionsPeriodReportUseCase.execute({
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        grouping: input.grouping,
        status: input.status,
        userId: input.userId,
        paymentMethodCode: input.paymentMethodCode,
      }),
      this.adminPaymentMethodUsageMetricsUseCase.execute({
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        status: input.status,
        userId: input.userId,
        paymentMethodCode: input.paymentMethodCode,
      }),
    ]);

    return {
      kpis: {
        totalTransactions: stats.remittanceCount,
        totalPaymentAmount: stats.totalPaymentAmount.toString(),
        totalReceivingAmount: stats.totalReceivingAmount.toString(),
      },
      periodTrend,
      topPaymentMethods: paymentMethodMetrics.slice(0, topPaymentMethodsLimit),
      period: {
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        grouping: input.grouping,
      },
      timezone: periodTrend[0]?.timezone ?? 'UTC',
    };
  }
}