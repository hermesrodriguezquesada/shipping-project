import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExchangeRateHistoryType, Prisma } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  EXCHANGE_RATE_HISTORY_RECORDER_PORT,
  VIP_EXCHANGE_RATE_COMMAND_PORT,
  VIP_EXCHANGE_RATE_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { ExchangeRateHistoryRecorderPort } from 'src/modules/exchange-rate-history/domain/ports/exchange-rate-history-recorder.port';
import { VipExchangeRateEntity } from '../../domain/entities/vip-exchange-rate.entity';
import { VipExchangeRateCommandPort } from '../../domain/ports/vip-exchange-rate-command.port';
import { VipExchangeRateQueryPort } from '../../domain/ports/vip-exchange-rate-query.port';

@Injectable()
export class AdminUpdateVipExchangeRateUseCase {
  private readonly logger = new Logger(AdminUpdateVipExchangeRateUseCase.name);

  constructor(
    @Inject(VIP_EXCHANGE_RATE_QUERY_PORT)
    private readonly vipExchangeRateQuery: VipExchangeRateQueryPort,
    @Inject(VIP_EXCHANGE_RATE_COMMAND_PORT)
    private readonly vipExchangeRateCommand: VipExchangeRateCommandPort,
    @Inject(EXCHANGE_RATE_HISTORY_RECORDER_PORT)
    private readonly exchangeRateHistoryRecorder: ExchangeRateHistoryRecorderPort,
  ) {}

  async execute(input: { id: string; rate?: string; enabled?: boolean }): Promise<VipExchangeRateEntity> {
    const existing = await this.vipExchangeRateQuery.findById(input.id);
    if (!existing) {
      throw new NotFoundDomainException('VIP exchange rate not found');
    }

    if (input.rate === undefined && input.enabled === undefined) {
      return existing;
    }

    const rate = input.rate !== undefined ? this.parseRate(input.rate) : undefined;
    const shouldRecordHistory = rate !== undefined && !existing.rate.eq(rate);

    await this.vipExchangeRateCommand.update({
      id: input.id,
      rate,
      enabled: input.enabled,
    });

    const updated = await this.vipExchangeRateQuery.findById(input.id);
    if (!updated) {
      throw new NotFoundDomainException('VIP exchange rate not found');
    }

    if (shouldRecordHistory) {
      await this.recordHistory(updated);
    }

    return updated;
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

  private parseRate(value: string): Prisma.Decimal {
    const normalized = value?.trim();
    if (!normalized) {
      throw new ValidationDomainException('rate is required');
    }

    try {
      const rate = new Prisma.Decimal(normalized);
      if (!rate.isFinite() || rate.lte(0)) {
        throw new ValidationDomainException('rate must be greater than 0');
      }
      return rate;
    } catch {
      throw new ValidationDomainException('rate must be a valid decimal number');
    }
  }
}