import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { ExchangeRateHistoryRecorderPort, RecordExchangeRateHistoryInput } from '../../domain/ports/exchange-rate-history-recorder.port';

@Injectable()
export class PrismaExchangeRateHistoryRecorderAdapter implements ExchangeRateHistoryRecorderPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordExchangeRateHistoryInput): Promise<void> {
    await this.prisma.exchangeRateHistory.create({
      data: {
        rateType: input.rateType,
        visibility: input.visibility,
        sourceRateId: input.sourceRateId ?? null,
        fromCurrencyId: input.fromCurrencyId ?? null,
        toCurrencyId: input.toCurrencyId ?? null,
        fromCurrencyCode: input.fromCurrencyCode,
        toCurrencyCode: input.toCurrencyCode,
        rate: input.rate,
      },
    });
  }
}