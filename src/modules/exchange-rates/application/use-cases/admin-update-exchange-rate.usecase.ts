import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExchangeRateHistoryType, Prisma } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  EXCHANGE_RATE_HISTORY_RECORDER_PORT,
  EXCHANGE_RATES_COMMAND_PORT,
  EXCHANGE_RATES_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { ExchangeRateHistoryRecorderPort } from 'src/modules/exchange-rate-history/domain/ports/exchange-rate-history-recorder.port';
import { ExchangeRatesCommandPort } from '../../domain/ports/exchange-rates-command.port';
import { ExchangeRateReadModel, ExchangeRatesQueryPort } from '../../domain/ports/exchange-rates-query.port';

@Injectable()
export class AdminUpdateExchangeRateUseCase {
  private readonly logger = new Logger(AdminUpdateExchangeRateUseCase.name);

  constructor(
    @Inject(EXCHANGE_RATES_QUERY_PORT)
    private readonly exchangeRatesQuery: ExchangeRatesQueryPort,
    @Inject(EXCHANGE_RATES_COMMAND_PORT)
    private readonly exchangeRatesCommand: ExchangeRatesCommandPort,
    @Inject(EXCHANGE_RATE_HISTORY_RECORDER_PORT)
    private readonly exchangeRateHistoryRecorder: ExchangeRateHistoryRecorderPort,
  ) {}

  async execute(input: { id: string; rate: string; enabled?: boolean }): Promise<ExchangeRateReadModel> {
    const existing = await this.exchangeRatesQuery.findById(input.id);
    const rate = this.parseRate(input.rate);
    const shouldRecordHistory = existing ? !existing.rate.eq(rate) : false;

    await this.exchangeRatesCommand.updateExchangeRate({
      id: input.id,
      rate,
      enabled: input.enabled,
    });

    const updated = await this.exchangeRatesQuery.findById(input.id);
    if (!updated) {
      throw new ValidationDomainException('Updated exchange rate not found');
    }

    if (shouldRecordHistory) {
      await this.recordHistory(updated);
    }

    return updated;
  }

  private async recordHistory(rate: ExchangeRateReadModel): Promise<void> {
    try {
      await this.exchangeRateHistoryRecorder.record({
        rateType: ExchangeRateHistoryType.GENERAL,
        sourceRateId: rate.id,
        fromCurrencyId: rate.fromCurrencyId,
        toCurrencyId: rate.toCurrencyId,
        fromCurrencyCode: rate.fromCurrency.code,
        toCurrencyCode: rate.toCurrency.code,
        rate: rate.rate,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Non-blocking exchange-rate history failure. rateType=GENERAL sourceRateId=${rate.id} pair=${rate.fromCurrency.code}->${rate.toCurrency.code} error=${message}`,
      );
    }
  }

  private parseRate(value: string): Prisma.Decimal {
    const normalized = value?.trim();
    if (!normalized) throw new ValidationDomainException('rate is required');

    try {
      const rate = new Prisma.Decimal(normalized);
      if (!rate.isFinite() || rate.lte(0)) throw new ValidationDomainException('rate must be greater than 0');
      return rate;
    } catch {
      throw new ValidationDomainException('rate must be a valid decimal number');
    }
  }
}
