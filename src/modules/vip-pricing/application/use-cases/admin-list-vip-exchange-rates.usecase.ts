import { Inject, Injectable } from '@nestjs/common';
import { VIP_EXCHANGE_RATE_QUERY_PORT } from 'src/shared/constants/tokens';
import { VipExchangeRateEntity } from '../../domain/entities/vip-exchange-rate.entity';
import { VipExchangeRateQueryPort } from '../../domain/ports/vip-exchange-rate-query.port';

@Injectable()
export class AdminListVipExchangeRatesUseCase {
  constructor(
    @Inject(VIP_EXCHANGE_RATE_QUERY_PORT)
    private readonly vipExchangeRateQuery: VipExchangeRateQueryPort,
  ) {}

  execute(input: {
    fromCurrencyCode?: string;
    toCurrencyCode?: string;
    enabled?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<VipExchangeRateEntity[]> {
    return this.vipExchangeRateQuery.list({
      fromCurrencyCode: input.fromCurrencyCode?.trim().toUpperCase(),
      toCurrencyCode: input.toCurrencyCode?.trim().toUpperCase(),
      enabled: input.enabled,
      limit: input.limit,
      offset: input.offset,
    });
  }
}