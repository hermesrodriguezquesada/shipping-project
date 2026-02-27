import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { EXCHANGE_RATES_COMMAND_PORT, EXCHANGE_RATES_QUERY_PORT } from 'src/shared/constants/tokens';
import { ExchangeRatesCommandPort } from '../../domain/ports/exchange-rates-command.port';
import { ExchangeRateReadModel, ExchangeRatesQueryPort } from '../../domain/ports/exchange-rates-query.port';

@Injectable()
export class AdminUpdateExchangeRateUseCase {
  constructor(
    @Inject(EXCHANGE_RATES_QUERY_PORT)
    private readonly exchangeRatesQuery: ExchangeRatesQueryPort,
    @Inject(EXCHANGE_RATES_COMMAND_PORT)
    private readonly exchangeRatesCommand: ExchangeRatesCommandPort,
  ) {}

  async execute(input: { id: string; rate: string; enabled?: boolean }): Promise<ExchangeRateReadModel> {
    await this.exchangeRatesCommand.updateExchangeRate({
      id: input.id,
      rate: this.parseRate(input.rate),
      enabled: input.enabled,
    });

    const rates = await this.exchangeRatesQuery.listExchangeRates({ limit: 500, offset: 0 });
    const updated = rates.find((rate) => rate.id === input.id);
    if (!updated) {
      throw new ValidationDomainException('Updated exchange rate not found');
    }

    return updated;
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
