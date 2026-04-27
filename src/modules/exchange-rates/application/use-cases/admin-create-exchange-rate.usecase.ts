import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExchangeRateHistoryType, Prisma } from '@prisma/client';
import {
  CATALOGS_QUERY_PORT,
  EXCHANGE_RATE_HISTORY_RECORDER_PORT,
  EXCHANGE_RATES_COMMAND_PORT,
  EXCHANGE_RATES_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { CatalogsQueryPort } from 'src/modules/catalogs/domain/ports/catalogs-query.port';
import { ExchangeRateHistoryRecorderPort } from 'src/modules/exchange-rate-history/domain/ports/exchange-rate-history-recorder.port';
import { ExchangeRateReadModel, ExchangeRatesQueryPort } from '../../domain/ports/exchange-rates-query.port';
import { ExchangeRatesCommandPort } from '../../domain/ports/exchange-rates-command.port';

@Injectable()
export class AdminCreateExchangeRateUseCase {
  private readonly logger = new Logger(AdminCreateExchangeRateUseCase.name);

  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(EXCHANGE_RATES_QUERY_PORT)
    private readonly exchangeRatesQuery: ExchangeRatesQueryPort,
    @Inject(EXCHANGE_RATES_COMMAND_PORT)
    private readonly exchangeRatesCommand: ExchangeRatesCommandPort,
    @Inject(EXCHANGE_RATE_HISTORY_RECORDER_PORT)
    private readonly exchangeRateHistoryRecorder: ExchangeRateHistoryRecorderPort,
  ) {}

  async execute(input: { from: string; to: string; rate: string; enabled?: boolean }): Promise<ExchangeRateReadModel> {
    const fromCode = input.from.trim().toUpperCase();
    const toCode = input.to.trim().toUpperCase();
    const shouldCreateActive = input.enabled ?? true;
    const rate = this.parseRate(input.rate);

    const fromCurrency = await this.catalogsQuery.findCurrencyByCode({ code: fromCode });
    const toCurrency = await this.catalogsQuery.findCurrencyByCode({ code: toCode });

    if (!fromCurrency || !fromCurrency.enabled) throw new ValidationDomainException('from currency is not enabled');
    if (!toCurrency || !toCurrency.enabled) throw new ValidationDomainException('to currency is not enabled');

    if (shouldCreateActive) {
      const existingActive = await this.exchangeRatesQuery.getLatestExchangeRate({
        fromCode,
        toCode,
      });
      if (existingActive) {
        throw new ValidationDomainException('Active exchange rate already exists for this currency pair');
      }
    }

    const id = await this.exchangeRatesCommand.createExchangeRate({
      fromCurrencyId: fromCurrency.id,
      toCurrencyId: toCurrency.id,
      rate,
      enabled: shouldCreateActive,
    });

    const created = await this.exchangeRatesQuery.findById(id);
    if (!created) {
      throw new ValidationDomainException('Created exchange rate not found');
    }

    await this.recordHistory(created);

    return created;
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
