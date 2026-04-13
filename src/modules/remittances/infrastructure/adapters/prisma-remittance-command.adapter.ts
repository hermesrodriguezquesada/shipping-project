import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import {
  BeneficiaryRelationship,
  DocumentType,
  OriginAccountHolderType,
  Prisma,
  ReceptionMethod,
  RemittanceStatus,
} from '@prisma/client';

@Injectable()
export class PrismaRemittanceCommandAdapter implements RemittanceCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async createPendingPayment(input: {
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
  }): Promise<string> {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { code: input.paymentMethodCode },
      select: { id: true },
    });

    const receptionMethodCatalog = await this.prisma.receptionMethodCatalog.findUnique({
      where: { code: input.receptionMethod },
      select: { id: true },
    });

    const remittance = await this.prisma.remittance.create({
      data: {
        senderUserId: input.senderUserId,
        beneficiaryId: input.beneficiaryId,
        recipientFullName: input.recipientFullName,
        recipientPhone: input.recipientPhone,
        recipientCountry: input.recipientCountry,
        recipientAddressLine1: input.recipientAddressLine1,
        recipientDocumentNumber: input.recipientDocumentNumber,
        recipientEmail: input.recipientEmail,
        recipientCity: input.recipientCity,
        recipientAddressLine2: input.recipientAddressLine2,
        recipientPostalCode: input.recipientPostalCode,
        recipientDocumentType: input.recipientDocumentType,
        recipientRelationship: input.recipientRelationship,
        recipientDeliveryInstructions: input.recipientDeliveryInstructions,
        amount: input.paymentAmount,
        status: RemittanceStatus.PENDING_PAYMENT,
        paymentMethodId: paymentMethod?.id,
        receptionMethodId: receptionMethodCatalog?.id,
        currencyId: input.paymentCurrencyId,
        receivingCurrencyId: input.receivingCurrencyId,
        destinationAccountNumber: input.destinationAccountNumber,
        originAccountHolderType: input.originAccountHolderType,
        originAccountHolderFirstName: input.originAccountHolderFirstName,
        originAccountHolderLastName: input.originAccountHolderLastName,
        originAccountHolderCompanyName: input.originAccountHolderCompanyName,
        originAccountData: input.originAccountData,
        exchangeRateIdUsed: input.exchangeRateIdUsed,
        exchangeRateRateUsed: input.exchangeRateRateUsed,
        exchangeRateUsedAt: input.exchangeRateUsedAt,
        commissionRuleIdUsed: input.commissionRuleIdUsed,
        commissionRuleVersionUsed: input.commissionRuleVersionUsed,
        commissionAmount: input.commissionAmount,
        commissionCurrencyIdUsed: input.commissionCurrencyIdUsed,
        deliveryFeeRuleIdUsed: input.deliveryFeeRuleIdUsed,
        deliveryFeeAmount: input.deliveryFeeAmount,
        deliveryFeeCurrencyIdUsed: input.deliveryFeeCurrencyIdUsed,
        netReceivingAmount: input.netReceivingAmount,
        netReceivingCurrencyIdUsed: input.netReceivingCurrencyIdUsed,
        feesBreakdownJson: input.feesBreakdownJson,
      },
      select: {
        id: true,
      },
    });

    return remittance.id;
  }


  async markPaid(input: { id: string; paymentDetails: string }): Promise<void> {
    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        status: RemittanceStatus.PENDING_PAYMENT_CONFIRMATION,
        paymentDetails: input.paymentDetails,
      },
    });
  }

  async attachPaymentProof(input: {
    id: string;
    paymentProofKey: string;
    paymentProofFileName: string;
    paymentProofMimeType: string;
    paymentProofSizeBytes: number;
    paymentProofUploadedAt: Date;
  }): Promise<void> {
    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        paymentProofKey: input.paymentProofKey,
        paymentProofFileName: input.paymentProofFileName,
        paymentProofMimeType: input.paymentProofMimeType,
        paymentProofSizeBytes: input.paymentProofSizeBytes,
        paymentProofUploadedAt: input.paymentProofUploadedAt,
      },
    });
  }

  async confirmPayment(input: { id: string }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.remittance.updateMany({
        where: {
          id: input.id,
          status: RemittanceStatus.PENDING_PAYMENT_CONFIRMATION,
        },
        data: {
          status: RemittanceStatus.PAID_SENDING_TO_RECEIVER,
        },
      });

      if (updated.count === 0) {
        return;
      }

      const remittance = await tx.remittance.findUnique({
        where: { id: input.id },
        select: {
          amount: true,
          senderUserId: true,
        },
      });

      if (!remittance) {
        return;
      }

      await tx.user.update({
        where: { id: remittance.senderUserId },
        data: {
          totalGeneratedAmount: {
            increment: remittance.amount,
          },
        },
      });
    });
  }

  async cancelByClient(input: { id: string }): Promise<void> {
    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        status: RemittanceStatus.CANCELED_BY_CLIENT,
      },
    });
  }

  async cancelByAdmin(input: { id: string; statusDescription: string }): Promise<void> {
    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        status: RemittanceStatus.CANCELED_BY_ADMIN,
        statusDescription: input.statusDescription,
      },
    });
  }

  async markDelivered(input: { id: string }): Promise<void> {
    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        status: RemittanceStatus.SUCCESS,
      },
    });
  }
}
