import { Inject, Injectable } from '@nestjs/common';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { EXCHANGE_RATE_HISTORY_QUERY_PORT } from 'src/shared/constants/tokens';
import { ExchangeRateHistoryEntity } from '../../domain/entities/exchange-rate-history.entity';
import {
  ExchangeRateHistoryQueryPort,
  ListPublicExchangeRateHistoryInput,
} from '../../domain/ports/exchange-rate-history-query.port';

@Injectable()
export class ListPublicExchangeRateHistoryUseCase {
  constructor(
    @Inject(EXCHANGE_RATE_HISTORY_QUERY_PORT)
    private readonly exchangeRateHistoryQuery: ExchangeRateHistoryQueryPort,
  ) {}

  async execute(input: Omit<ListPublicExchangeRateHistoryInput, 'limit' | 'offset'> & { limit?: number; offset?: number }): Promise<ExchangeRateHistoryEntity[]> {
    if (input.dateFrom && input.dateTo && input.dateFrom > input.dateTo) {
      throw new ValidationDomainException('dateFrom must be less than or equal to dateTo');
    }

    return this.exchangeRateHistoryQuery.listPublic({
      rateTypes: input.rateTypes,
      fromCurrencyCode: input.fromCurrencyCode?.trim().toUpperCase(),
      toCurrencyCode: input.toCurrencyCode?.trim().toUpperCase(),
      currencyCode: input.currencyCode?.trim().toUpperCase(),
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
    });
  }
}