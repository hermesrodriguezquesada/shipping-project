import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { VipExchangeRateEntity } from '../../domain/entities/vip-exchange-rate.entity';
import { VipExchangeRateQueryPort } from '../../domain/ports/vip-exchange-rate-query.port';

@Injectable()
export class PrismaVipExchangeRateQueryAdapter implements VipExchangeRateQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<VipExchangeRateEntity | null> {
    return this.prisma.vipExchangeRate.findUnique({
      where: { id },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
    });
  }

  findByCurrencyPair(input: {
    fromCurrencyCode: string;
    toCurrencyCode: string;
    enabledOnly?: boolean;
  }): Promise<VipExchangeRateEntity | null> {
    return this.prisma.vipExchangeRate.findFirst({
      where: {
        fromCurrency: { code: input.fromCurrencyCode },
        toCurrency: { code: input.toCurrencyCode },
        ...(input.enabledOnly === true ? { enabled: true } : {}),
      },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
    });
  }

  list(input: {
    fromCurrencyCode?: string;
    toCurrencyCode?: string;
    enabled?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<VipExchangeRateEntity[]> {
    return this.prisma.vipExchangeRate.findMany({
      where: {
        fromCurrency: input.fromCurrencyCode ? { code: input.fromCurrencyCode } : undefined,
        toCurrency: input.toCurrencyCode ? { code: input.toCurrencyCode } : undefined,
        enabled: input.enabled,
      },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    });
  }
}