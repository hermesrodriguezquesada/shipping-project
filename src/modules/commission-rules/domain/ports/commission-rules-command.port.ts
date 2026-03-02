import { OriginAccountHolderType, Prisma } from '@prisma/client';

export interface CommissionRulesCommandPort {
  createVersion(input: {
    currencyId: string;
    holderType: OriginAccountHolderType;
    thresholdAmount: Prisma.Decimal;
    percentRate: Prisma.Decimal;
    flatFee: Prisma.Decimal;
    enabled: boolean;
  }): Promise<string>;
  setEnabled(input: { id: string; enabled: boolean }): Promise<void>;
}
