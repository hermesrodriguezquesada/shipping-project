import { ExchangeRateHistoryType } from '@prisma/client';
import { ExchangeRateHistoryEntity } from '../entities/exchange-rate-history.entity';

export interface ListPublicExchangeRateHistoryInput {
  rateTypes?: ExchangeRateHistoryType[];
  fromCurrencyCode?: string;
  toCurrencyCode?: string;
  currencyCode?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit: number;
  offset: number;
}

export interface ExchangeRateHistoryQueryPort {
  listPublic(input: ListPublicExchangeRateHistoryInput): Promise<ExchangeRateHistoryEntity[]>;
}