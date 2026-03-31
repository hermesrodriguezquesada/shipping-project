import { Injectable } from '@nestjs/common';
import { Prisma, RemittanceStatus } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  PaymentMethodUsageMetricReadModel,
  RemittanceForSubmit,
  RemittanceQueryPort,
  RemittanceReadModel,
  TransactionsAmountStatsReadModel,
  TransactionsPeriodBucketReadModel,
  TransactionsPeriodGrouping,
} from '../../domain/ports/remittance-query.port';

const remittanceReadInclude = {
  sender: true,
  beneficiary: true,
  paymentMethod: true,
  receptionMethodCatalog: {
    include: {
      currency: true,
    },
  },
  paymentCurrency: true,
  receivingCurrency: true,
  exchangeRateUsed: {
    include: {
      fromCurrency: true,
      toCurrency: true,
    },
  },
  externalPayments: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  },
} as const;

@Injectable()
export class PrismaRemittanceQueryAdapter implements RemittanceQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMyRemittanceById(input: { id: string; senderUserId: string }): Promise<RemittanceReadModel | null> {
    return this.prisma.remittance.findFirst({
      where: {
        id: input.id,
        senderUserId: input.senderUserId,
      },
      include: {
        ...remittanceReadInclude,
      },
    }).then((remittance) => (remittance ? this.toRemittanceReadModel(remittance) : null));
  }

  async listMyRemittances(input: {
    senderUserId: string;
    limit?: number;
    offset?: number;
  }): Promise<RemittanceReadModel[]> {
    return this.prisma.remittance.findMany({
      where: {
        senderUserId: input.senderUserId,
      },
      include: {
        ...remittanceReadInclude,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    }).then((remittances) => remittances.map((remittance) => this.toRemittanceReadModel(remittance)));
  }

  async listRemittances(input: { limit?: number; offset?: number }): Promise<RemittanceReadModel[]> {
    return this.prisma.remittance.findMany({
      include: {
        ...remittanceReadInclude,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    }).then((remittances) => remittances.map((remittance) => this.toRemittanceReadModel(remittance)));
  }

  async listRemittancesByUser(input: { userId: string; limit?: number; offset?: number }): Promise<RemittanceReadModel[]> {
    return this.prisma.remittance.findMany({
      where: {
        senderUserId: input.userId,
      },
      include: {
        ...remittanceReadInclude,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    }).then((remittances) => remittances.map((remittance) => this.toRemittanceReadModel(remittance)));
  }

  async listAdminTransactions(input: {
    status?: RemittanceStatus;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    paymentMethodCode?: string;
    limit?: number;
    offset?: number;
  }): Promise<RemittanceReadModel[]> {
    const paymentMethodId = await this.resolvePaymentMethodId(input.paymentMethodCode);
    if (paymentMethodId === null) {
      return [];
    }

    return this.prisma.remittance.findMany({
      where: this.buildWhere({
        status: input.status,
        userId: input.userId,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        paymentMethodId,
      }),
      include: {
        ...remittanceReadInclude,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: input.offset,
      take: input.limit,
    }).then((remittances) => remittances.map((remittance) => this.toRemittanceReadModel(remittance)));
  }

  async findRemittanceById(input: { id: string }): Promise<RemittanceReadModel | null> {
    return this.prisma.remittance.findUnique({
      where: { id: input.id },
      include: {
        ...remittanceReadInclude,
      },
    }).then((remittance) => (remittance ? this.toRemittanceReadModel(remittance) : null));
  }

  async reportTransactionsByPeriod(input: {
    dateFrom: Date;
    dateTo: Date;
    grouping: TransactionsPeriodGrouping;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
  }): Promise<TransactionsPeriodBucketReadModel[]> {
    const paymentMethodId = await this.resolvePaymentMethodId(input.paymentMethodCode);
    if (paymentMethodId === null) {
      return [];
    }

    const rows = await this.prisma.remittance.findMany({
      where: this.buildWhere({
        status: input.status,
        userId: input.userId,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        paymentMethodId,
      }),
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const buckets = new Map<string, TransactionsPeriodBucketReadModel>();

    for (const row of rows) {
      const range = this.getBucketRange(row.createdAt, input.grouping);
      const key = range.periodStart.toISOString();
      const current = buckets.get(key);

      if (current) {
        current.transactionCount += 1;
        continue;
      }

      buckets.set(key, {
        periodStart: range.periodStart,
        periodEnd: range.periodEnd,
        transactionCount: 1,
        timezone: 'UTC',
      });
    }

    return [...buckets.values()].sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
  }

  async getTransactionsAmountStats(input: {
    dateFrom: Date;
    dateTo: Date;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
  }): Promise<TransactionsAmountStatsReadModel> {
    const paymentMethodId = await this.resolvePaymentMethodId(input.paymentMethodCode);
    if (paymentMethodId === null) {
      return {
        totalPaymentAmount: new Prisma.Decimal(0),
        totalReceivingAmount: new Prisma.Decimal(0),
        remittanceCount: 0,
      };
    }

    const aggregate = await this.prisma.remittance.aggregate({
      where: this.buildWhere({
        status: input.status,
        userId: input.userId,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        paymentMethodId,
      }),
      _sum: {
        amount: true,
        netReceivingAmount: true,
      },
      _count: {
        _all: true,
      },
    });

    return {
      totalPaymentAmount: aggregate._sum.amount ?? new Prisma.Decimal(0),
      totalReceivingAmount: aggregate._sum.netReceivingAmount ?? new Prisma.Decimal(0),
      remittanceCount: aggregate._count._all,
    };
  }

  async getPaymentMethodUsageMetrics(input: {
    dateFrom: Date;
    dateTo: Date;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
  }): Promise<PaymentMethodUsageMetricReadModel[]> {
    const paymentMethodId = await this.resolvePaymentMethodId(input.paymentMethodCode);
    if (paymentMethodId === null) {
      return [];
    }

    const grouped = await this.prisma.remittance.groupBy({
      by: ['paymentMethodId'],
      where: this.buildWhere({
        status: input.status,
        userId: input.userId,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        paymentMethodId,
      }),
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    });

    const paymentMethodIds = grouped
      .map((entry) => entry.paymentMethodId)
      .filter((value): value is string => Boolean(value));

    const methods = paymentMethodIds.length
      ? await this.prisma.paymentMethod.findMany({
          where: {
            id: {
              in: paymentMethodIds,
            },
          },
          select: {
            id: true,
            code: true,
            name: true,
          },
        })
      : [];

    const methodsById = new Map(methods.map((method) => [method.id, method]));

    return grouped.map((entry) => {
      const method = entry.paymentMethodId ? methodsById.get(entry.paymentMethodId) : undefined;
      return {
        paymentMethodCode: method?.code ?? null,
        paymentMethodName: method?.name ?? null,
        usageCount: entry._count._all,
        totalPaymentAmount: entry._sum.amount ?? new Prisma.Decimal(0),
      };
    }).sort((a, b) => b.usageCount - a.usageCount);
  }

  async findByIdAndSenderUser(input: { id: string; senderUserId: string }): Promise<RemittanceForSubmit | null> {
    return this.prisma.remittance
      .findFirst({
        where: {
          id: input.id,
          senderUserId: input.senderUserId,
        },
        select: {
          id: true,
          status: true,
          sender: {
            select: {
              email: true,
            },
          },
        },
      })
      .then((remittance) =>
        remittance
          ? {
              id: remittance.id,
              status: remittance.status,
              senderEmail: remittance.sender.email,
            }
          : null,
      );
  }

  async beneficiaryBelongsToUser(input: { beneficiaryId: string; ownerUserId: string }): Promise<boolean> {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: {
        id: input.beneficiaryId,
        ownerUserId: input.ownerUserId,
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    return !!beneficiary;
  }

  private async resolvePaymentMethodId(code?: string): Promise<string | undefined | null> {
    if (!code) {
      return undefined;
    }

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      return null;
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: {
        code: normalizedCode,
      },
      select: {
        id: true,
      },
    });

    return paymentMethod?.id ?? null;
  }

  private buildWhere(input: {
    status?: RemittanceStatus;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    paymentMethodId?: string;
  }): Prisma.RemittanceWhereInput {
    const createdAt: Prisma.DateTimeFilter | undefined =
      input.dateFrom || input.dateTo
        ? {
            ...(input.dateFrom ? { gte: input.dateFrom } : {}),
            ...(input.dateTo ? { lte: input.dateTo } : {}),
          }
        : undefined;

    return {
      ...(input.status ? { status: input.status } : {}),
      ...(input.userId ? { senderUserId: input.userId } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(input.paymentMethodId ? { paymentMethodId: input.paymentMethodId } : {}),
    };
  }

  private getBucketRange(date: Date, grouping: TransactionsPeriodGrouping): { periodStart: Date; periodEnd: Date } {
    const utcDate = new Date(date);
    const year = utcDate.getUTCFullYear();
    const month = utcDate.getUTCMonth();
    const day = utcDate.getUTCDate();

    if (grouping === 'DAILY') {
      const periodStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const periodEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      return { periodStart, periodEnd };
    }

    if (grouping === 'MONTHLY') {
      const periodStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const periodEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      return { periodStart, periodEnd };
    }

    const dayOfWeek = utcDate.getUTCDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const periodStart = new Date(Date.UTC(year, month, day - distanceToMonday, 0, 0, 0, 0));
    const periodEnd = new Date(Date.UTC(
      periodStart.getUTCFullYear(),
      periodStart.getUTCMonth(),
      periodStart.getUTCDate() + 6,
      23,
      59,
      59,
      999,
    ));

    return { periodStart, periodEnd };
  }

  private toRemittanceReadModel(remittance: any): RemittanceReadModel {
    const latestExternalPayment = remittance.externalPayments?.[0]
      ? {
          id: remittance.externalPayments[0].id,
          provider: remittance.externalPayments[0].provider,
          status: remittance.externalPayments[0].status,
          amount: remittance.externalPayments[0].amount,
          currencyCode: remittance.externalPayments[0].currencyCode,
          checkoutUrl: remittance.externalPayments[0].checkoutUrl,
          createdAt: remittance.externalPayments[0].createdAt,
          updatedAt: remittance.externalPayments[0].updatedAt,
        }
      : null;

    return {
      ...remittance,
      feesBreakdownJson: remittance.feesBreakdownJson ?? null,
      netReceivingAmount: remittance.netReceivingAmount ?? null,
      latestExternalPayment,
    };
  }
}
