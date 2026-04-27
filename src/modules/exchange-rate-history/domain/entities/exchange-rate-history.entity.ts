import { ExchangeRateHistoryType, ExchangeRateHistoryVisibility, Prisma } from '@prisma/client';

export type ExchangeRateHistoryEntity = {
  id: string;
  rateType: ExchangeRateHistoryType;
  visibility: ExchangeRateHistoryVisibility;
  sourceRateId: string | null;
  fromCurrencyId: string | null;
  toCurrencyId: string | null;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  rate: Prisma.Decimal;
  createdAt: Date;
};