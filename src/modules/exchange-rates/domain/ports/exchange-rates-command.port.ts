import { Prisma } from '@prisma/client';

export interface ExchangeRatesCommandPort {
  createExchangeRate(input: { fromCurrencyId: string; toCurrencyId: string; rate: Prisma.Decimal; enabled: boolean }): Promise<string>;
  updateExchangeRate(input: { id: string; rate: Prisma.Decimal; enabled?: boolean }): Promise<void>;
  deleteExchangeRate(input: { id: string }): Promise<void>;
}
