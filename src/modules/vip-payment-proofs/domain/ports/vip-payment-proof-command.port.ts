import { Prisma } from '@prisma/client';

export interface VipPaymentProofCommandPort {
  create(input: {
    userId: string;
    accountHolderName: string;
    amount: Prisma.Decimal;
    currencyId: string;
    paymentProofKey: string;
  }): Promise<string>;

  confirmPending(input: {
    id: string;
    reviewedById: string;
    reviewedAt: Date;
  }): Promise<boolean>;

  cancelPending(input: {
    id: string;
    reason: string;
    reviewedById: string;
    reviewedAt: Date;
  }): Promise<boolean>;
}