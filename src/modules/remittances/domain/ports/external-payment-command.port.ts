import { ExternalPaymentProvider, ExternalPaymentStatus, Prisma } from '@prisma/client';
import { ExternalPaymentReadModel } from './external-payment-query.port';

export interface ExternalPaymentCommandPort {
  create(input: {
    remittanceId: string;
    provider: ExternalPaymentProvider;
    status: ExternalPaymentStatus;
    amount: Prisma.Decimal;
    currencyCode: string;
    idempotencyKey: string;
    metadataJson?: Prisma.InputJsonValue;
  }): Promise<ExternalPaymentReadModel>;

  updateSessionData(input: {
    id: string;
    providerPaymentId: string | null;
    providerSessionId: string | null;
    checkoutUrl: string | null;
    status: ExternalPaymentStatus;
    expiresAt: Date | null;
    metadataJson?: Prisma.InputJsonValue;
  }): Promise<ExternalPaymentReadModel>;

  updateWebhookMetadata(input: {
    id: string;
    providerEventId?: string | null;
    lastWebhookEventId?: string | null;
    lastWebhookReceivedAt?: Date | null;
    status?: ExternalPaymentStatus;
    metadataJson?: Prisma.InputJsonValue;
  }): Promise<ExternalPaymentReadModel>;

  markAsAccepted(input: {
    id: string;
    status?: ExternalPaymentStatus;
    acceptedAt?: Date;
  }): Promise<ExternalPaymentReadModel>;
}
