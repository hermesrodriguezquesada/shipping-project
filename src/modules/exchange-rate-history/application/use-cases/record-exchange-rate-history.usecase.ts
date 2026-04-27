import { Injectable } from '@nestjs/common';
import { ExchangeRateHistoryType, ExchangeRateHistoryVisibility } from '@prisma/client';
import {
  ExchangeRateHistoryRecorderPort,
  RecordExchangeRateHistoryInput,
} from '../../domain/ports/exchange-rate-history-recorder.port';
import { PrismaExchangeRateHistoryRecorderAdapter } from '../../infrastructure/adapters/prisma-exchange-rate-history-recorder.adapter';

@Injectable()
export class RecordExchangeRateHistoryUseCase implements ExchangeRateHistoryRecorderPort {
  constructor(private readonly recorder: PrismaExchangeRateHistoryRecorderAdapter) {}

  async record(input: RecordExchangeRateHistoryInput): Promise<void> {
    await this.recorder.record({
      ...input,
      visibility: input.visibility ?? this.resolveVisibility(input.rateType),
      fromCurrencyCode: input.fromCurrencyCode.trim().toUpperCase(),
      toCurrencyCode: input.toCurrencyCode.trim().toUpperCase(),
    });
  }

  private resolveVisibility(rateType: ExchangeRateHistoryType): ExchangeRateHistoryVisibility {
    if (rateType === ExchangeRateHistoryType.GENERAL) {
      return ExchangeRateHistoryVisibility.PUBLIC;
    }

    return ExchangeRateHistoryVisibility.PRIVATE;
  }
}