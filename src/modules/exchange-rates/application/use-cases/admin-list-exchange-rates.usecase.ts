import { Inject, Injectable } from '@nestjs/common';
import { EXCHANGE_RATES_QUERY_PORT } from 'src/shared/constants/tokens';
import { ExchangeRateReadModel, ExchangeRatesQueryPort } from '../../domain/ports/exchange-rates-query.port';

@Injectable()
export class AdminListExchangeRatesUseCase {
  constructor(
    @Inject(EXCHANGE_RATES_QUERY_PORT)
    private readonly exchangeRatesQuery: ExchangeRatesQueryPort,
  ) {}

  execute(input: { from?: string; to?: string; limit?: number; offset?: number }): Promise<ExchangeRateReadModel[]> {
    return this.exchangeRatesQuery.listExchangeRates({
      fromCode: input.from?.trim().toUpperCase(),
      toCode: input.to?.trim().toUpperCase(),
      limit: input.limit,
      offset: input.offset,
    });
  }
}
