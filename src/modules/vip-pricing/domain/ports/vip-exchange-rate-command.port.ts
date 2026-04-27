import { Prisma } from '@prisma/client';

export interface VipExchangeRateCommandPort {
  create(input: {
    fromCurrencyId: string;
    toCurrencyId: string;
    rate: Prisma.Decimal;
    enabled: boolean;
  }): Promise<string>;
  update(input: { id: string; rate?: Prisma.Decimal; enabled?: boolean }): Promise<void>;
  setEnabled(input: { id: string; enabled: boolean }): Promise<void>;
}