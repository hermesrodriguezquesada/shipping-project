import { Inject, Injectable } from '@nestjs/common';
import { EXCHANGE_RATES_QUERY_PORT } from 'src/shared/constants/tokens';
import { ExchangeRateReadModel, ExchangeRatesQueryPort } from '../../domain/ports/exchange-rates-query.port';

@Injectable()
export class GetLatestExchangeRateUseCase {
  constructor(
    @Inject(EXCHANGE_RATES_QUERY_PORT)
    private readonly exchangeRatesQuery: ExchangeRatesQueryPort,
  ) {}

  async execute(from: string, to: string): Promise<ExchangeRateReadModel | null> {
    return this.exchangeRatesQuery.getLatestExchangeRate({
      fromCode: from.trim().toUpperCase(),
      toCode: to.trim().toUpperCase(),
    });
  }
}
