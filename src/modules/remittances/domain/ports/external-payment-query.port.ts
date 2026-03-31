import { ExternalPaymentProvider, ExternalPaymentStatus, Prisma } from '@prisma/client';

export interface ExternalPaymentReadModel {
  id: string;
  remittanceId: string;
  provider: ExternalPaymentProvider;
  providerPaymentId: string | null;
  providerSessionId: string | null;
  providerEventId: string | null;
  checkoutUrl: string | null;
  status: ExternalPaymentStatus;
  amount: Prisma.Decimal;
  currencyCode: string;
  idempotencyKey: string;
  metadataJson: Prisma.JsonValue | null;
  expiresAt: Date | null;
  lastWebhookEventId: string | null;
  lastWebhookReceivedAt: Date | null;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExternalPaymentQueryPort {
  findReusableActiveSession(input: {
    remittanceId: string;
    provider: ExternalPaymentProvider;
  }): Promise<ExternalPaymentReadModel | null>;

  findByProviderDetails(input: {
    provider: ExternalPaymentProvider;
    providerPaymentId?: string;
    providerEventId?: string;
  }): Promise<ExternalPaymentReadModel | null>;

  hasProcessedEvent(input: {
    provider: ExternalPaymentProvider;
    providerEventId: string;
  }): Promise<boolean>;
}
