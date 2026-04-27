import { VipExchangeRateEntity } from '../entities/vip-exchange-rate.entity';

export interface VipExchangeRateQueryPort {
  findById(id: string): Promise<VipExchangeRateEntity | null>;
  findByCurrencyPair(input: {
    fromCurrencyCode: string;
    toCurrencyCode: string;
    enabledOnly?: boolean;
  }): Promise<VipExchangeRateEntity | null>;
  list(input: {
    fromCurrencyCode?: string;
    toCurrencyCode?: string;
    enabled?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<VipExchangeRateEntity[]>;
}