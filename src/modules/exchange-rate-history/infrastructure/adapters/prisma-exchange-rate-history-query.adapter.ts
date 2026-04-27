import { ExchangeRateHistoryVisibility } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { ExchangeRateHistoryEntity } from '../../domain/entities/exchange-rate-history.entity';
import { ExchangeRateHistoryQueryPort, ListPublicExchangeRateHistoryInput } from '../../domain/ports/exchange-rate-history-query.port';

@Injectable()
export class PrismaExchangeRateHistoryQueryAdapter implements ExchangeRateHistoryQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(input: ListPublicExchangeRateHistoryInput): Promise<ExchangeRateHistoryEntity[]> {
    return this.prisma.exchangeRateHistory.findMany({
      where: {
        visibility: ExchangeRateHistoryVisibility.PUBLIC,
        rateType: input.rateTypes?.length ? { in: input.rateTypes } : undefined,
        fromCurrencyCode: input.fromCurrencyCode,
        toCurrencyCode: input.toCurrencyCode,
        ...(input.currencyCode
          ? {
              OR: [
                { fromCurrencyCode: input.currencyCode },
                { toCurrencyCode: input.currencyCode },
              ],
            }
          : {}),
        ...(input.dateFrom || input.dateTo
          ? {
              createdAt: {
                ...(input.dateFrom ? { gte: input.dateFrom } : {}),
                ...(input.dateTo ? { lte: input.dateTo } : {}),
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    });
  }
}