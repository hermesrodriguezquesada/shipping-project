import { Inject, Injectable } from '@nestjs/common';
import { EXCHANGE_RATES_QUERY_PORT } from 'src/shared/constants/tokens';
import { ExchangeRateReadModel, ExchangeRatesQueryPort } from '../../domain/ports/exchange-rates-query.port';

@Injectable()
export class ListExchangeRatesPublicUseCase {
  constructor(
    @Inject(EXCHANGE_RATES_QUERY_PORT)
    private readonly exchangeRatesQuery: ExchangeRatesQueryPort,
  ) {}

  execute(input: {
    from?: string;
    to?: string;
    enabledOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ExchangeRateReadModel[]> {
    return this.exchangeRatesQuery.listPublicExchangeRates({
      from: input.from?.trim().toUpperCase(),
      to: input.to?.trim().toUpperCase(),
      enabledOnly: input.enabledOnly ?? true,
      limit: input.limit,
      offset: input.offset,
    });
  }
}
