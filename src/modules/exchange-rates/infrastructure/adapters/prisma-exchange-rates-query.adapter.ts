import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { ExchangeRateReadModel, ExchangeRatesQueryPort } from '../../domain/ports/exchange-rates-query.port';

@Injectable()
export class PrismaExchangeRatesQueryAdapter implements ExchangeRatesQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestExchangeRate(input: { fromCode: string; toCode: string }): Promise<ExchangeRateReadModel | null> {
    return this.prisma.exchangeRate.findFirst({
      where: {
        enabled: true,
        fromCurrency: { code: input.fromCode },
        toCurrency: { code: input.toCode },
      },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async listExchangeRates(input: {
    fromCode?: string;
    toCode?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExchangeRateReadModel[]> {
    return this.prisma.exchangeRate.findMany({
      where: {
        fromCurrency: input.fromCode ? { code: input.fromCode } : undefined,
        toCurrency: input.toCode ? { code: input.toCode } : undefined,
      },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    });
  }

  async listPublicExchangeRates(input: {
    from?: string;
    to?: string;
    enabledOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ExchangeRateReadModel[]> {
    const enabledOnly = input.enabledOnly ?? true;

    return this.prisma.exchangeRate.findMany({
      where: {
        ...(enabledOnly ? { enabled: true } : {}),
        ...(input.from ? { fromCurrency: { code: input.from } } : {}),
        ...(input.to ? { toCurrency: { code: input.to } } : {}),
      },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip: input.offset,
      take: input.limit,
    });
  }
}
