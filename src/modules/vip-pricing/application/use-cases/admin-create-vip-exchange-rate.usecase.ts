import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExchangeRateHistoryType, Prisma } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { CatalogsQueryPort } from 'src/modules/catalogs/domain/ports/catalogs-query.port';
import { ExchangeRateHistoryRecorderPort } from 'src/modules/exchange-rate-history/domain/ports/exchange-rate-history-recorder.port';
import {
  CATALOGS_QUERY_PORT,
  EXCHANGE_RATE_HISTORY_RECORDER_PORT,
  VIP_EXCHANGE_RATE_COMMAND_PORT,
  VIP_EXCHANGE_RATE_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { VipExchangeRateEntity } from '../../domain/entities/vip-exchange-rate.entity';
import { VipExchangeRateCommandPort } from '../../domain/ports/vip-exchange-rate-command.port';
import { VipExchangeRateQueryPort } from '../../domain/ports/vip-exchange-rate-query.port';

@Injectable()
export class AdminCreateVipExchangeRateUseCase {
  private readonly logger = new Logger(AdminCreateVipExchangeRateUseCase.name);

  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(VIP_EXCHANGE_RATE_QUERY_PORT)
    private readonly vipExchangeRateQuery: VipExchangeRateQueryPort,
    @Inject(VIP_EXCHANGE_RATE_COMMAND_PORT)
    private readonly vipExchangeRateCommand: VipExchangeRateCommandPort,
    @Inject(EXCHANGE_RATE_HISTORY_RECORDER_PORT)
    private readonly exchangeRateHistoryRecorder: ExchangeRateHistoryRecorderPort,
  ) {}

  async execute(input: {
    fromCurrencyCode: string;
    toCurrencyCode: string;
    rate: string;
    enabled?: boolean;
  }): Promise<VipExchangeRateEntity> {
    const fromCurrencyCode = input.fromCurrencyCode.trim().toUpperCase();
    const toCurrencyCode = input.toCurrencyCode.trim().toUpperCase();
    const enabled = input.enabled ?? true;
    const rate = this.parseDecimal(input.rate, 'rate');

    if (fromCurrencyCode === toCurrencyCode) {
      throw new ValidationDomainException('fromCurrencyCode must be different from toCurrencyCode');
    }

    const fromCurrency = await this.catalogsQuery.findCurrencyByCode({ code: fromCurrencyCode });
    const toCurrency = await this.catalogsQuery.findCurrencyByCode({ code: toCurrencyCode });

    if (!fromCurrency || !fromCurrency.enabled) {
      throw new ValidationDomainException('from currency is not enabled');
    }

    if (!toCurrency || !toCurrency.enabled) {
      throw new ValidationDomainException('to currency is not enabled');
    }

    const existing = await this.vipExchangeRateQuery.findByCurrencyPair({
      fromCurrencyCode,
      toCurrencyCode,
    });
    if (existing) {
      throw new ValidationDomainException('VIP exchange rate already exists for this currency pair');
    }

    const id = await this.vipExchangeRateCommand.create({
      fromCurrencyId: fromCurrency.id,
      toCurrencyId: toCurrency.id,
      rate,
      enabled,
    });

    const created = await this.vipExchangeRateQuery.findById(id);
    if (!created) {
      throw new ValidationDomainException('Created VIP exchange rate not found');
    }

    await this.recordHistory(created);

    return created;
  }

  private async recordHistory(rate: VipExchangeRateEntity): Promise<void> {
    try {
      await this.exchangeRateHistoryRecorder.record({
        rateType: ExchangeRateHistoryType.VIP,
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
        `Non-blocking exchange-rate history failure. rateType=VIP sourceRateId=${rate.id} pair=${rate.fromCurrency.code}->${rate.toCurrency.code} error=${message}`,
      );
    }
  }

  private parseDecimal(value: string, field: string): Prisma.Decimal {
    const normalized = value?.trim();
    if (!normalized) {
      throw new ValidationDomainException(`${field} is required`);
    }

    try {
      const decimal = new Prisma.Decimal(normalized);
      if (!decimal.isFinite() || decimal.lte(0)) {
        throw new ValidationDomainException(`${field} must be greater than 0`);
      }
      return decimal;
    } catch {
      throw new ValidationDomainException(`${field} must be a valid decimal number`);
    }
  }
}