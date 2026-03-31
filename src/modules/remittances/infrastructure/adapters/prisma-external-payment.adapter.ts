import { ExternalPaymentProvider, ExternalPaymentStatus, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { ExternalPaymentCommandPort } from '../../domain/ports/external-payment-command.port';
import { ExternalPaymentQueryPort, ExternalPaymentReadModel } from '../../domain/ports/external-payment-query.port';

@Injectable()
export class PrismaExternalPaymentAdapter implements ExternalPaymentCommandPort, ExternalPaymentQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findReusableActiveSession(input: {
    remittanceId: string;
    provider: ExternalPaymentProvider;
  }): Promise<ExternalPaymentReadModel | null> {
    const payment = await this.prisma.externalPayment.findFirst({
      where: {
        remittanceId: input.remittanceId,
        provider: input.provider,
        status: {
          in: [ExternalPaymentStatus.CREATED, ExternalPaymentStatus.PENDING],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payment;
  }

  async findByProviderDetails(input: {
    provider: ExternalPaymentProvider;
    providerPaymentId?: string;
    providerEventId?: string;
  }): Promise<ExternalPaymentReadModel | null> {
    const where: Prisma.ExternalPaymentWhereInput = {
      provider: input.provider,
    };

    if (input.providerPaymentId) {
      where.providerPaymentId = input.providerPaymentId;
    } else if (input.providerEventId) {
      where.providerEventId = input.providerEventId;
    } else {
      return null;
    }

    return this.prisma.externalPayment.findFirst({ where });
  }

  async hasProcessedEvent(input: {
    provider: ExternalPaymentProvider;
    providerEventId: string;
  }): Promise<boolean> {
    const count = await this.prisma.externalPayment.count({
      where: {
        provider: input.provider,
        providerEventId: input.providerEventId,
      },
    });

    return count > 0;
  }

  async create(input: {
    remittanceId: string;
    provider: ExternalPaymentProvider;
    status: ExternalPaymentStatus;
    amount: Prisma.Decimal;
    currencyCode: string;
    idempotencyKey: string;
    metadataJson?: Prisma.InputJsonValue;
  }): Promise<ExternalPaymentReadModel> {
    return this.prisma.externalPayment.create({
      data: {
        remittanceId: input.remittanceId,
        provider: input.provider,
        status: input.status,
        amount: input.amount,
        currencyCode: input.currencyCode,
        idempotencyKey: input.idempotencyKey,
        metadataJson: input.metadataJson,
      },
    });
  }

  async updateSessionData(input: {
    id: string;
    providerPaymentId: string | null;
    providerSessionId: string | null;
    checkoutUrl: string | null;
    status: ExternalPaymentStatus;
    expiresAt: Date | null;
    metadataJson?: Prisma.InputJsonValue;
  }): Promise<ExternalPaymentReadModel> {
    return this.prisma.externalPayment.update({
      where: { id: input.id },
      data: {
        providerPaymentId: input.providerPaymentId,
        providerSessionId: input.providerSessionId,
        checkoutUrl: input.checkoutUrl,
        status: input.status,
        expiresAt: input.expiresAt,
        metadataJson: input.metadataJson,
      },
    });
  }

  async updateWebhookMetadata(input: {
    id: string;
    providerEventId?: string | null;
    lastWebhookEventId?: string | null;
    lastWebhookReceivedAt?: Date | null;
    status?: ExternalPaymentStatus;
    metadataJson?: Prisma.InputJsonValue;
  }): Promise<ExternalPaymentReadModel> {
    const data: Prisma.ExternalPaymentUpdateInput = {};

    if (input.providerEventId !== undefined) data.providerEventId = input.providerEventId;
    if (input.lastWebhookEventId !== undefined) data.lastWebhookEventId = input.lastWebhookEventId;
    if (input.lastWebhookReceivedAt !== undefined) data.lastWebhookReceivedAt = input.lastWebhookReceivedAt;
    if (input.status !== undefined) data.status = input.status;
    if (input.metadataJson !== undefined) data.metadataJson = input.metadataJson;

    return this.prisma.externalPayment.update({
      where: { id: input.id },
      data,
    });
  }

  async markAsAccepted(input: {
    id: string;
    status?: ExternalPaymentStatus;
    acceptedAt?: Date;
  }): Promise<ExternalPaymentReadModel> {
    const data: Prisma.ExternalPaymentUpdateInput = {
      acceptedAt: input.acceptedAt ?? new Date(),
    };

    if (input.status !== undefined) data.status = input.status;

    return this.prisma.externalPayment.update({
      where: { id: input.id },
      data,
    });
  }
}

