import { OriginAccountHolderType, OriginAccountType, ReceptionMethod } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface RemittanceCommandPort {
  createDraft(input: {
    senderUserId: string;
    beneficiaryId: string;
    amount: Prisma.Decimal;
  }): Promise<string>;

  setOriginAccount(input: {
    id: string;
    paymentMethodCode: OriginAccountType;
    originZelleEmail: string | null;
    originIban: string | null;
    originStripePaymentMethodId: string | null;
  }): Promise<void>;

  updateAmount(input: { id: string; amount: Prisma.Decimal }): Promise<void>;

  setReceptionMethod(input: {
    id: string;
    receptionMethodCode: ReceptionMethod;
    destinationCupCardNumber: string | null;
  }): Promise<void>;

  setReceivingCurrency(input: { id: string; receivingCurrencyId: string }): Promise<void>;

  setDestinationCupCard(input: { id: string; destinationCupCardNumber: string }): Promise<void>;

  setOriginAccountHolder(input: {
    id: string;
    originAccountHolderType: OriginAccountHolderType;
    originAccountHolderFirstName: string | null;
    originAccountHolderLastName: string | null;
    originAccountHolderCompanyName: string | null;
  }): Promise<void>;

  submit(input: { id: string; exchangeRateIdUsed?: string; exchangeRateRateUsed?: Prisma.Decimal; exchangeRateUsedAt?: Date }): Promise<void>;

  markPaid(input: { id: string; paymentDetails: string }): Promise<void>;
  confirmPayment(input: { id: string }): Promise<void>;
  cancelByClient(input: { id: string }): Promise<void>;
  cancelByAdmin(input: { id: string; statusDescription: string }): Promise<void>;
  markDelivered(input: { id: string }): Promise<void>;
}
