import {
  BeneficiaryRelationship,
  DocumentType,
  OriginAccountHolderType,
  ReceptionMethod,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface RemittanceCommandPort {
  createPendingPayment(input: {
    senderUserId: string;
    beneficiaryId: string;
    recipientFullName: string;
    recipientPhone: string;
    recipientCountry: string;
    recipientAddressLine1: string;
    recipientDocumentNumber: string;
    recipientEmail: string | null;
    recipientCity: string | null;
    recipientAddressLine2: string | null;
    recipientPostalCode: string | null;
    recipientDocumentType: DocumentType | null;
    recipientRelationship: BeneficiaryRelationship | null;
    recipientDeliveryInstructions: string | null;
    paymentAmount: Prisma.Decimal;
    paymentMethodCode: string;
    originAccountData: Prisma.InputJsonValue;
    paymentCurrencyId: string;
    receivingCurrencyId: string;
    receptionMethod: ReceptionMethod;
    destinationAccountNumber: string | null;
    originAccountHolderType: OriginAccountHolderType;
    originAccountHolderFirstName: string | null;
    originAccountHolderLastName: string | null;
    originAccountHolderCompanyName: string | null;
    exchangeRateIdUsed: string;
    exchangeRateRateUsed: Prisma.Decimal;
    exchangeRateUsedAt: Date;
    commissionRuleIdUsed: string | null;
    commissionRuleVersionUsed: number | null;
    commissionAmount: Prisma.Decimal;
    commissionCurrencyIdUsed: string | null;
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
