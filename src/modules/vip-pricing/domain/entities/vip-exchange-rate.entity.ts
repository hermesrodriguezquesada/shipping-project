import { Prisma } from '@prisma/client';
import { CurrencyCatalogReadModel } from 'src/modules/catalogs/domain/ports/catalogs-query.port';

export type VipExchangeRateEntity = {
  id: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: Prisma.Decimal;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  fromCurrency: CurrencyCatalogReadModel;
  toCurrency: CurrencyCatalogReadModel;
};