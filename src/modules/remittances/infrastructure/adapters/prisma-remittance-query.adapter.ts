import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  CurrencyCatalogReadModel,
  ExchangeRateReadModel,
  PaymentMethodReadModel,
  ReceptionMethodCatalogReadModel,
  RemittanceForSubmit,
  RemittanceQueryPort,
  RemittanceReadModel,
} from '../../domain/ports/remittance-query.port';

const remittanceReadInclude = {
  beneficiary: true,
  transfer: true,
  paymentMethod: true,
  receptionMethodCatalog: true,
  paymentCurrency: true,
  receivingCurrency: true,
  exchangeRateUsed: {
    include: {
      fromCurrency: true,
      toCurrency: true,
    },
  },
} as const;

@Injectable()
export class PrismaRemittanceQueryAdapter implements RemittanceQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMyRemittanceById(input: { id: string; senderUserId: string }): Promise<RemittanceReadModel | null> {
    return this.prisma.remittance.findFirst({
      where: {
        id: input.id,
        senderUserId: input.senderUserId,
      },
      include: {
        ...remittanceReadInclude,
      },
    }).then((remittance) => (remittance ? this.toRemittanceReadModel(remittance) : null));
  }

  async listMyRemittances(input: {
    senderUserId: string;
    limit?: number;
    offset?: number;
  }): Promise<RemittanceReadModel[]> {
    return this.prisma.remittance.findMany({
      where: {
        senderUserId: input.senderUserId,
      },
      include: {
        ...remittanceReadInclude,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    }).then((remittances) => remittances.map((remittance) => this.toRemittanceReadModel(remittance)));
  }

  async listRemittances(input: { limit?: number; offset?: number }): Promise<RemittanceReadModel[]> {
    return this.prisma.remittance.findMany({
      include: {
        ...remittanceReadInclude,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    }).then((remittances) => remittances.map((remittance) => this.toRemittanceReadModel(remittance)));
  }

  async listRemittancesByUser(input: { userId: string; limit?: number; offset?: number }): Promise<RemittanceReadModel[]> {
    return this.prisma.remittance.findMany({
      where: {
        senderUserId: input.userId,
      },
      include: {
        ...remittanceReadInclude,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    }).then((remittances) => remittances.map((remittance) => this.toRemittanceReadModel(remittance)));
  }

  async findRemittanceById(input: { id: string }): Promise<RemittanceReadModel | null> {
    return this.prisma.remittance.findUnique({
      where: { id: input.id },
      include: {
        ...remittanceReadInclude,
      },
    }).then((remittance) => (remittance ? this.toRemittanceReadModel(remittance) : null));
  }

  async findByIdAndSenderUser(input: { id: string; senderUserId: string }): Promise<RemittanceForSubmit | null> {
    return this.prisma.remittance.findFirst({
      where: {
        id: input.id,
        senderUserId: input.senderUserId,
      },
      select: {
        id: true,
        status: true,
        amount: true,
        currencyId: true,
        receivingCurrencyId: true,
        paymentMethod: {
          select: {
            code: true,
          },
        },
        originZelleEmail: true,
        originIban: true,
        originStripePaymentMethodId: true,
        receptionMethodCatalog: {
          select: {
            code: true,
          },
        },
        destinationCupCardNumber: true,
        originAccountHolderType: true,
        originAccountHolderFirstName: true,
        originAccountHolderLastName: true,
        originAccountHolderCompanyName: true,
      },
    }).then((remittance) => {
      if (!remittance) {
        return null;
      }

      return {
        ...remittance,
        paymentMethodCode: remittance.paymentMethod?.code ?? null,
        receptionMethodCode: remittance.receptionMethodCatalog?.code ?? null,
      };
    });
  }

  async beneficiaryBelongsToUser(input: { beneficiaryId: string; ownerUserId: string }): Promise<boolean> {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: {
        id: input.beneficiaryId,
        ownerUserId: input.ownerUserId,
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    return !!beneficiary;
  }

  async listPaymentMethods(input: { enabledOnly?: boolean }): Promise<PaymentMethodReadModel[]> {
    return this.prisma.paymentMethod.findMany({
      where: input.enabledOnly === true ? { enabled: true } : undefined,
      orderBy: { code: 'asc' },
    });
  }

  async findPaymentMethodByCode(input: { code: string }): Promise<PaymentMethodReadModel | null> {
    return this.prisma.paymentMethod.findUnique({
      where: {
        code: input.code,
      },
    });
  }

  async listReceptionMethods(input: { enabledOnly?: boolean }): Promise<ReceptionMethodCatalogReadModel[]> {
    return this.prisma.receptionMethodCatalog.findMany({
      where: input.enabledOnly === true ? { enabled: true } : undefined,
      orderBy: { code: 'asc' },
    });
  }

  async findReceptionMethodByCode(input: { code: string }): Promise<ReceptionMethodCatalogReadModel | null> {
    return this.prisma.receptionMethodCatalog.findUnique({
      where: { code: input.code },
    });
  }

  async listCurrencies(input: { enabledOnly?: boolean }): Promise<CurrencyCatalogReadModel[]> {
    return this.prisma.currencyCatalog.findMany({
      where: input.enabledOnly === true ? { enabled: true } : undefined,
      orderBy: { code: 'asc' },
    });
  }

  async findCurrencyByCode(input: { code: string }): Promise<CurrencyCatalogReadModel | null> {
    return this.prisma.currencyCatalog.findUnique({
      where: { code: input.code },
    });
  }

  async findCurrencyById(input: { id: string }): Promise<CurrencyCatalogReadModel | null> {
    return this.prisma.currencyCatalog.findUnique({
      where: { id: input.id },
    });
  }

  async getLatestExchangeRate(input: { fromCode: string; toCode: string }): Promise<ExchangeRateReadModel | null> {
    return this.prisma.exchangeRate.findFirst({
      where: {
        enabled: true,
        fromCurrency: { code: input.fromCode },
        toCurrency: { code: input.toCode },
      },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async listExchangeRates(input: {
    fromCode?: string;
    toCode?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExchangeRateReadModel[]> {
    return this.prisma.exchangeRate.findMany({
      where: {
        fromCurrency: input.fromCode ? { code: input.fromCode } : undefined,
        toCurrency: input.toCode ? { code: input.toCode } : undefined,
      },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    });
  }

  private toRemittanceReadModel(remittance: any): RemittanceReadModel {
    return {
      ...remittance,
      paymentMethodCode: remittance.paymentMethod?.code ?? null,
      receptionMethodCode: remittance.receptionMethodCatalog?.code ?? null,
    };
  }
}
