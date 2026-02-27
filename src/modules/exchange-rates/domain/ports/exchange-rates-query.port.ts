import { Prisma } from '@prisma/client';
import { CurrencyCatalogReadModel } from 'src/modules/catalogs/domain/ports/catalogs-query.port';

export interface ExchangeRateReadModel {
  id: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: Prisma.Decimal;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  fromCurrency: CurrencyCatalogReadModel;
  toCurrency: CurrencyCatalogReadModel;
}

export interface ExchangeRatesQueryPort {
  getLatestExchangeRate(input: { fromCode: string; toCode: string }): Promise<ExchangeRateReadModel | null>;
  listExchangeRates(input: { fromCode?: string; toCode?: string; limit?: number; offset?: number }): Promise<ExchangeRateReadModel[]>;
}
