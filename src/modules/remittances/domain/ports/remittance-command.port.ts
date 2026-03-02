import { OriginAccountHolderType, OriginAccountType, ReceptionMethod } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface RemittanceCommandPort {
  createPendingPayment(input: {
    senderUserId: string;
    beneficiaryId: string;
    paymentAmount: Prisma.Decimal;
    originAccountType: OriginAccountType;
    paymentCurrencyId: string;
    receivingCurrencyId: string;
    receptionMethod: ReceptionMethod;
    destinationCupCardNumber: string | null;
    originAccountHolderType: OriginAccountHolderType;
    originAccountHolderFirstName: string | null;
    originAccountHolderLastName: string | null;
    originAccountHolderCompanyName: string | null;
    originZelleEmail: string | null;
    originIban: string | null;
    originStripePaymentMethodId: string | null;
    exchangeRateIdUsed: string;
    exchangeRateRateUsed: Prisma.Decimal;
    exchangeRateUsedAt: Date;
    commissionRuleIdUsed: string;
    commissionRuleVersionUsed: number;
    commissionAmount: Prisma.Decimal;
    commissionCurrencyIdUsed: string;
    deliveryFeeRuleIdUsed: string | null;
    deliveryFeeAmount: Prisma.Decimal;
    deliveryFeeCurrencyIdUsed: string;
    netReceivingAmount: Prisma.Decimal;
    netReceivingCurrencyIdUsed: string;
    feesBreakdownJson: string;
  }): Promise<string>;

  markPaid(input: { id: string; paymentDetails: string }): Promise<void>;
  confirmPayment(input: { id: string }): Promise<void>;
  cancelByClient(input: { id: string }): Promise<void>;
  cancelByAdmin(input: { id: string; statusDescription: string }): Promise<void>;
  markDelivered(input: { id: string }): Promise<void>;
}
