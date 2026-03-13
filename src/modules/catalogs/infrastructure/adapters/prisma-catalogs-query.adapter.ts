import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CatalogsQueryPort, CurrencyCatalogReadModel, PaymentMethodReadModel, ReceptionMethodCatalogReadModel } from '../../domain/ports/catalogs-query.port';

const paymentMethodSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  type: true,
  additionalData: true,
  enabled: true,
  imgUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaCatalogsQueryAdapter implements CatalogsQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listPaymentMethods(input: { enabledOnly?: boolean }): Promise<PaymentMethodReadModel[]> {
    return this.prisma.paymentMethod.findMany({
      where: input.enabledOnly === true ? { enabled: true } : undefined,
      select: paymentMethodSelect,
      orderBy: { code: 'asc' },
    });
  }

  async findPaymentMethodByCode(input: { code: string }): Promise<PaymentMethodReadModel | null> {
    return this.prisma.paymentMethod.findUnique({
      where: { code: input.code },
      select: paymentMethodSelect,
    });
  }

  async listReceptionMethods(input: { enabledOnly?: boolean }): Promise<ReceptionMethodCatalogReadModel[]> {
    return this.prisma.receptionMethodCatalog.findMany({
      where: input.enabledOnly === true ? { enabled: true } : undefined,
      include: {
        currency: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  async findReceptionMethodByCode(input: { code: string }): Promise<ReceptionMethodCatalogReadModel | null> {
    return this.prisma.receptionMethodCatalog.findUnique({
      where: { code: input.code },
      include: {
        currency: true,
      },
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
}
