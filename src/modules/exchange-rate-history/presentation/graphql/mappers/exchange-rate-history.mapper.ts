import { ExchangeRateHistoryEntity } from 'src/modules/exchange-rate-history/domain/entities/exchange-rate-history.entity';
import { ExchangeRateHistoryItemType } from '../types/exchange-rate-history-item.type';

export class ExchangeRateHistoryMapper {
  static toGraphQL(item: ExchangeRateHistoryEntity): ExchangeRateHistoryItemType {
    return {
      rateType: item.rateType,
      fromCurrencyCode: item.fromCurrencyCode,
      toCurrencyCode: item.toCurrencyCode,
      rate: item.rate.toString(),
      createdAt: item.createdAt,
    };
  }
}