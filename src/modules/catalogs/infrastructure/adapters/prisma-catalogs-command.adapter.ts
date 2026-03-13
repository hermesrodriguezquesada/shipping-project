import { Injectable } from '@nestjs/common';
import { PaymentMethodType, ReceptionPayoutMethod } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { CatalogsCommandPort } from '../../domain/ports/catalogs-command.port';

@Injectable()
export class PrismaCatalogsCommandAdapter implements CatalogsCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async createPaymentMethod(input: {
    code: string;
    name: string;
    description: string | null;
    additionalData: string | null;
    imgUrl: string | null;
    enabled: boolean;
  }): Promise<void> {
    await this.prisma.paymentMethod.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        additionalData: input.additionalData,
        imgUrl: input.imgUrl,
        enabled: input.enabled,
        type: PaymentMethodType.MANUAL,
      },
    });
  }

  async updatePaymentMethodDescription(input: { code: string; description: string | null }): Promise<void> {
    await this.prisma.paymentMethod.update({
      where: { code: input.code },
      data: { description: input.description, updatedAt: new Date() },
    });
  }

  async updatePaymentMethodAdditionalData(input: { code: string; additionalData: string | null }): Promise<void> {
    await this.prisma.paymentMethod.update({
      where: { code: input.code },
      data: { additionalData: input.additionalData, updatedAt: new Date() },
    });
  }

  async setPaymentMethodEnabled(input: { code: string; enabled: boolean }): Promise<void> {
    await this.prisma.paymentMethod.update({
      where: { code: input.code },
      data: { enabled: input.enabled, updatedAt: new Date() },
    });
  }

  async createReceptionMethod(input: {
    code: string;
    name: string;
    currencyId: string;
    method: ReceptionPayoutMethod;
    description: string | null;
    imgUrl: string | null;
    enabled: boolean;
  }): Promise<void> {
    await this.prisma.receptionMethodCatalog.create({
      data: {
        code: input.code,
        name: input.name,
        currencyId: input.currencyId,
        method: input.method,
        description: input.description,
        imgUrl: input.imgUrl,
        enabled: input.enabled,
      },
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
      data: { enabled: input.enabled },
    });
  }
}
