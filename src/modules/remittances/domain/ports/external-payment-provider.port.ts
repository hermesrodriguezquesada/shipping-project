import { ExternalPaymentProvider, ExternalPaymentStatus, Prisma } from '@prisma/client';

export interface CreatePaymentSessionProviderInput {
  provider: ExternalPaymentProvider;
  amount: Prisma.Decimal;
  currencyCode: string;
  idempotencyKey: string;
  remittanceId: string;
  userId: string;
  metadataJson?: Prisma.InputJsonValue;
}

export interface CreatePaymentSessionProviderResult {
  provider: ExternalPaymentProvider;
  providerPaymentId: string | null;
  providerSessionId: string | null;
  checkoutUrl: string | null;
  status: ExternalPaymentStatus;
  expiresAt: Date | null;
  metadataJson?: Prisma.InputJsonValue;
}

export interface CanonicalExternalPaymentWebhookEvent {
  provider: ExternalPaymentProvider;
  providerEventId: string | null;
  providerPaymentId: string | null;
  type: string;
  status: ExternalPaymentStatus;
  occurredAt: Date | null;
  metadata?: Record<string, unknown>;
  isTerminal: boolean;
  rawPayload?: unknown;
}

export interface ParseAndVerifyWebhookInput {
  provider: ExternalPaymentProvider;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
  rawBody?: string | Buffer;
}

export interface ExternalPaymentProviderPort {
  createPaymentSession(input: CreatePaymentSessionProviderInput): Promise<CreatePaymentSessionProviderResult>;
  parseAndVerifyWebhook(input: ParseAndVerifyWebhookInput): Promise<CanonicalExternalPaymentWebhookEvent>;
}
