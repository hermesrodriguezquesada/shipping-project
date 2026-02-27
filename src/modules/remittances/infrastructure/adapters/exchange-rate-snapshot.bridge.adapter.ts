import { Inject, Injectable } from '@nestjs/common';
import { ExchangeRatesQueryPort } from 'src/modules/exchange-rates/domain/ports/exchange-rates-query.port';
import { EXCHANGE_RATES_QUERY_PORT } from 'src/shared/constants/tokens';
import { ExchangeRateSnapshotPort } from '../../domain/ports/exchange-rate-snapshot.port';

@Injectable()
export class ExchangeRateSnapshotBridgeAdapter implements ExchangeRateSnapshotPort {
  constructor(
    @Inject(EXCHANGE_RATES_QUERY_PORT)
    private readonly exchangeRatesQuery: ExchangeRatesQueryPort,
  ) {}

  async getLatestEnabledRate(input: { fromCode: string; toCode: string }) {
    const rate = await this.exchangeRatesQuery.getLatestExchangeRate(input);
    if (!rate) {
      return null;
    }

    return { id: rate.id, fromCode: input.fromCode, toCode: input.toCode, rate: rate.rate };
  }
}
