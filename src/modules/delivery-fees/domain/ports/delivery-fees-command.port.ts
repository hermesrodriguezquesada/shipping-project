import { Prisma } from '@prisma/client';

export interface DeliveryFeesCommandPort {
  createRule(input: {
    currencyId: string;
    country: string;
    region?: string | null;
    city?: string | null;
    amount: Prisma.Decimal;
    enabled: boolean;
  }): Promise<string>;
  updateRule(input: {
    id: string;
    country?: string;
    region?: string | null;
    city?: string | null;
    amount?: Prisma.Decimal;
    enabled?: boolean;
  }): Promise<void>;
  setEnabled(input: { id: string; enabled: boolean }): Promise<void>;
}
