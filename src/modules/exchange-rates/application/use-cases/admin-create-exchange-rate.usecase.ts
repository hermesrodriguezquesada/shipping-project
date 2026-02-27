import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CATALOGS_QUERY_PORT, EXCHANGE_RATES_COMMAND_PORT, EXCHANGE_RATES_QUERY_PORT } from 'src/shared/constants/tokens';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { CatalogsQueryPort } from 'src/modules/catalogs/domain/ports/catalogs-query.port';
import { ExchangeRateReadModel, ExchangeRatesQueryPort } from '../../domain/ports/exchange-rates-query.port';
import { ExchangeRatesCommandPort } from '../../domain/ports/exchange-rates-command.port';

@Injectable()
export class AdminCreateExchangeRateUseCase {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(EXCHANGE_RATES_QUERY_PORT)
    private readonly exchangeRatesQuery: ExchangeRatesQueryPort,
    @Inject(EXCHANGE_RATES_COMMAND_PORT)
    private readonly exchangeRatesCommand: ExchangeRatesCommandPort,
  ) {}

  async execute(input: { from: string; to: string; rate: string; enabled?: boolean }): Promise<ExchangeRateReadModel> {
    const fromCode = input.from.trim().toUpperCase();
    const toCode = input.to.trim().toUpperCase();

    const fromCurrency = await this.catalogsQuery.findCurrencyByCode({ code: fromCode });
    const toCurrency = await this.catalogsQuery.findCurrencyByCode({ code: toCode });

    if (!fromCurrency || !fromCurrency.enabled) throw new ValidationDomainException('from currency is not enabled');
    if (!toCurrency || !toCurrency.enabled) throw new ValidationDomainException('to currency is not enabled');

    const id = await this.exchangeRatesCommand.createExchangeRate({
      fromCurrencyId: fromCurrency.id,
      toCurrencyId: toCurrency.id,
      rate: this.parseRate(input.rate),
      enabled: input.enabled ?? true,
    });

    const rates = await this.exchangeRatesQuery.listExchangeRates({ limit: 500, offset: 0 });
    const created = rates.find((rate) => rate.id === id);
    if (!created) {
      throw new ValidationDomainException('Created exchange rate not found');
    }

    return created;
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
