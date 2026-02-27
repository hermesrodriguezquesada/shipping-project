import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import {
  OriginAccountHolderType,
  OriginAccountType,
  Prisma,
  ReceptionMethod,
  RemittanceStatus,
  TransferStatus,
} from '@prisma/client';

@Injectable()
export class PrismaRemittanceCommandAdapter implements RemittanceCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async createDraft(input: {
    senderUserId: string;
    beneficiaryId: string;
    amount: Prisma.Decimal;
  }): Promise<string> {
    const defaultCurrency = await this.prisma.currencyCatalog.findUnique({
      where: { code: 'USD' },
      select: { id: true },
    });

    const remittance = await this.prisma.remittance.create({
      data: {
        senderUserId: input.senderUserId,
        beneficiaryId: input.beneficiaryId,
        amount: input.amount,
        status: RemittanceStatus.DRAFT,
        currencyId: defaultCurrency?.id,
      },
      select: {
        id: true,
      },
    });

    return remittance.id;
  }

  async setOriginAccount(input: {
    id: string;
    paymentMethodCode: OriginAccountType;
    originZelleEmail: string | null;
    originIban: string | null;
    originStripePaymentMethodId: string | null;
  }): Promise<void> {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { code: input.paymentMethodCode },
      select: { id: true },
    });

    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        paymentMethodId: paymentMethod?.id,
        originZelleEmail: input.originZelleEmail,
        originIban: input.originIban,
        originStripePaymentMethodId: input.originStripePaymentMethodId,
      },
    });
  }

  async updateAmount(input: { id: string; amount: Prisma.Decimal }): Promise<void> {
    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        amount: input.amount,
      },
    });
  }

  async setReceptionMethod(input: {
    id: string;
    receptionMethodCode: ReceptionMethod;
    destinationCupCardNumber: string | null;
  }): Promise<void> {
    const receptionMethodCatalog = await this.prisma.receptionMethodCatalog.findUnique({
      where: { code: input.receptionMethodCode },
      select: { id: true },
    });

    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        receptionMethodId: receptionMethodCatalog?.id,
        destinationCupCardNumber: input.destinationCupCardNumber,
      },
    });
  }

  async setReceivingCurrency(input: { id: string; receivingCurrencyId: string }): Promise<void> {
    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        receivingCurrencyId: input.receivingCurrencyId,
        exchangeRateIdUsed: null,
        exchangeRateRateUsed: null,
        exchangeRateUsedAt: null,
      },
    });
  }

  async setDestinationCupCard(input: { id: string; destinationCupCardNumber: string }): Promise<void> {
    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        destinationCupCardNumber: input.destinationCupCardNumber,
      },
    });
  }

  async setOriginAccountHolder(input: {
    id: string;
    originAccountHolderType: OriginAccountHolderType;
    originAccountHolderFirstName: string | null;
    originAccountHolderLastName: string | null;
    originAccountHolderCompanyName: string | null;
  }): Promise<void> {
    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        originAccountHolderType: input.originAccountHolderType,
        originAccountHolderFirstName: input.originAccountHolderFirstName,
        originAccountHolderLastName: input.originAccountHolderLastName,
        originAccountHolderCompanyName: input.originAccountHolderCompanyName,
      },
    });
  }

  async submit(input: {
    id: string;
    exchangeRateIdUsed?: string;
    exchangeRateRateUsed?: Prisma.Decimal;
    exchangeRateUsedAt?: Date;
  }): Promise<void> {
    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        status: RemittanceStatus.PENDING_PAYMENT,
        exchangeRateIdUsed: input.exchangeRateIdUsed,
        exchangeRateRateUsed: input.exchangeRateRateUsed,
        exchangeRateUsedAt: input.exchangeRateUsedAt,
      },
    });

    const existingTransfer = await this.prisma.transfer.findUnique({
      where: { remittanceId: input.id },
      select: { id: true },
    });

    if (!existingTransfer) {
      await this.prisma.transfer.create({
        data: {
          remittanceId: input.id,
          status: TransferStatus.PENDING,
        },
      });
    }
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

  async confirmPayment(input: { id: string }): Promise<void> {
    await this.prisma.remittance.update({
      where: { id: input.id },
      data: {
        status: RemittanceStatus.PAID_SENDING_TO_RECEIVER,
      },
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

  async updatePaymentMethodDescription(input: { code: string; description: string | null }): Promise<void> {
    await this.prisma.paymentMethod.update({
      where: { code: input.code },
      data: { description: input.description, updatedAt: new Date() },
    });
  }

  async setPaymentMethodEnabled(input: { code: string; enabled: boolean }): Promise<void> {
    await this.prisma.paymentMethod.update({
      where: { code: input.code },
      data: { enabled: input.enabled, updatedAt: new Date() },
    });
  }

  async updateReceptionMethodDescription(input: { code: string; description: string | null }): Promise<void> {
    await this.prisma.receptionMethodCatalog.update({
      where: { code: input.code },
      data: { description: input.description, updatedAt: new Date() },
    });
  }

  async setReceptionMethodEnabled(input: { code: string; enabled: boolean }): Promise<void> {
    await this.prisma.receptionMethodCatalog.update({
      where: { code: input.code },
      data: { enabled: input.enabled, updatedAt: new Date() },
    });
  }

  async createCurrency(input: { code: string; name: string; description: string | null; imgUrl: string | null }): Promise<void> {
    await this.prisma.currencyCatalog.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        imgUrl: input.imgUrl,
        enabled: true,
      },
    });
  }

  async updateCurrency(input: { code: string; name: string; description: string | null; imgUrl: string | null }): Promise<void> {
    await this.prisma.currencyCatalog.update({
      where: { code: input.code },
      data: {
        name: input.name,
        description: input.description,
        imgUrl: input.imgUrl,
      },
    });
  }

  async setCurrencyEnabled(input: { code: string; enabled: boolean }): Promise<void> {
    await this.prisma.currencyCatalog.update({
      where: { code: input.code },
      data: {
        enabled: input.enabled,
      },
    });
  }

  async createExchangeRate(input: {
    fromCurrencyId: string;
    toCurrencyId: string;
    rate: Prisma.Decimal;
    enabled: boolean;
  }): Promise<string> {
    const exchangeRate = await this.prisma.exchangeRate.create({
      data: {
        fromCurrencyId: input.fromCurrencyId,
        toCurrencyId: input.toCurrencyId,
        rate: input.rate,
        enabled: input.enabled,
      },
      select: {
        id: true,
      },
    });

    return exchangeRate.id;
  }

  async updateExchangeRate(input: { id: string; rate: Prisma.Decimal; enabled?: boolean }): Promise<void> {
    await this.prisma.exchangeRate.update({
      where: { id: input.id },
      data: {
        rate: input.rate,
        enabled: input.enabled,
      },
    });
  }

  async deleteExchangeRate(input: { id: string }): Promise<void> {
    await this.prisma.exchangeRate.update({
      where: { id: input.id },
      data: {
        enabled: false,
      },
    });
  }
}
