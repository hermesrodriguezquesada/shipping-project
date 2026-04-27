import { ExchangeRateHistoryType, ExchangeRateHistoryVisibility, Prisma } from '@prisma/client';

export interface RecordExchangeRateHistoryInput {
  rateType: ExchangeRateHistoryType;
  visibility?: ExchangeRateHistoryVisibility;
  sourceRateId?: string | null;
  fromCurrencyId?: string | null;
  toCurrencyId?: string | null;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  rate: Prisma.Decimal;
}

export interface ExchangeRateHistoryRecorderPort {
  record(input: RecordExchangeRateHistoryInput): Promise<void>;
}