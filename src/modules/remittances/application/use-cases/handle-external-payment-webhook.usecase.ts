import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExternalPaymentProvider, ExternalPaymentStatus } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  EXTERNAL_PAYMENT_COMMAND_PORT,
  EXTERNAL_PAYMENT_PROVIDER_PORT,
  EXTERNAL_PAYMENT_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { CanonicalExternalPaymentWebhookEvent, ExternalPaymentProviderPort, ParseAndVerifyWebhookInput } from '../../domain/ports/external-payment-provider.port';
import { ExternalPaymentCommandPort } from '../../domain/ports/external-payment-command.port';
import { ExternalPaymentQueryPort } from '../../domain/ports/external-payment-query.port';
import { ExternalPaymentAcceptanceUseCase } from './external-payment-acceptance.usecase';

/**
 * Handles webhook events from external payment providers.
 * 
 * Responsibilities:
 * 1. Parse and verify webhook authenticity
 * 2. Deduplicate events
 * 3. Update external payment state
 * 4. Trigger acceptance for successful payments
 */
@Injectable()
export class HandleExternalPaymentWebhookUseCase {
  private readonly logger = new Logger(HandleExternalPaymentWebhookUseCase.name);

  constructor(
    @Inject(EXTERNAL_PAYMENT_PROVIDER_PORT)
    private readonly externalPaymentProvider: ExternalPaymentProviderPort,
    @Inject(EXTERNAL_PAYMENT_QUERY_PORT)
    private readonly externalPaymentQuery: ExternalPaymentQueryPort,
    @Inject(EXTERNAL_PAYMENT_COMMAND_PORT)
    private readonly externalPaymentCommand: ExternalPaymentCommandPort,
    private readonly acceptanceUseCase: ExternalPaymentAcceptanceUseCase,
  ) {}

  async execute(input: {
    provider: ExternalPaymentProvider;
    headers: Record<string, string | string[] | undefined>;
    body: unknown;
    rawBody?: string | Buffer;
  }): Promise<void> {
    const parseInput: ParseAndVerifyWebhookInput = {
      provider: input.provider,
      headers: input.headers,
      body: input.body,
      rawBody: input.rawBody,
    };

    let event: CanonicalExternalPaymentWebhookEvent;
    try {
      event = await this.externalPaymentProvider.parseAndVerifyWebhook(parseInput);
    } catch (error) {
      this.logger.error(`Webhook verification failed for provider ${input.provider}:`, error);
      throw new ValidationDomainException('Invalid webhook signature');
    }

    this.logger.debug(
      `Processing webhook event for provider ${event.provider}: type=${event.type}, status=${event.status}, paymentId=${event.providerPaymentId}`,
    );

    const shouldSkip = await this.applyIdempotency(event);
    if (shouldSkip) {
      return;
    }

    if (event.status === ExternalPaymentStatus.SUCCEEDED) {
      await this.handleSuccessfulPayment(event);
    } else if (event.isTerminal) {
      await this.handleTerminalEvent(event);
    }
  }

  private async applyIdempotency(event: CanonicalExternalPaymentWebhookEvent): Promise<boolean> {
    if (!event.providerEventId && !event.providerPaymentId) {
      this.logger.warn('Webhook event missing both providerEventId and providerPaymentId; skipping idempotency check');
      return false;
    }

    if (event.providerEventId && (await this.externalPaymentQuery.hasProcessedEvent({
      provider: event.provider,
      providerEventId: event.providerEventId,
    }))) {
      this.logger.debug(`Webhook event already processed: ${event.providerEventId}; skipping`);
      return true;
    }

    if (event.providerPaymentId && event.isTerminal) {
      const existing = await this.externalPaymentQuery.findByProviderDetails({
        provider: event.provider,
        providerPaymentId: event.providerPaymentId,
      });

      if (existing && existing.status === event.status) {
        this.logger.debug(
          `Payment ${event.providerPaymentId} already in status ${event.status}; skipping duplicate`,
        );
        return true;
      }
    }

    return false;
  }

  private async handleSuccessfulPayment(event: CanonicalExternalPaymentWebhookEvent): Promise<void> {
    const payment = await this.externalPaymentQuery.findByProviderDetails({
      provider: event.provider,
      providerPaymentId: event.providerPaymentId ?? undefined,
      providerEventId: event.providerEventId ?? undefined,
    });

    if (!payment) {
      this.logger.warn(
        `No external payment found for provider ${event.provider}, paymentId ${event.providerPaymentId}`,
      );
      return;
    }

    await this.externalPaymentCommand.markAsAccepted({
      id: payment.id,
      status: ExternalPaymentStatus.SUCCEEDED,
      acceptedAt: event.occurredAt ?? new Date(),
    });

    await this.externalPaymentCommand.updateWebhookMetadata({
      id: payment.id,
      providerEventId: event.providerEventId ?? undefined,
      lastWebhookEventId: event.providerEventId ?? undefined,
      lastWebhookReceivedAt: new Date(),
    });

    this.logger.debug(`Payment ${payment.id} marked as accepted; triggering internal acceptance flow`);

    await this.acceptanceUseCase.execute({ remittanceId: payment.remittanceId });
  }

  private async handleTerminalEvent(event: CanonicalExternalPaymentWebhookEvent): Promise<void> {
    const payment = await this.externalPaymentQuery.findByProviderDetails({
      provider: event.provider,
      providerPaymentId: event.providerPaymentId ?? undefined,
      providerEventId: event.providerEventId ?? undefined,
    });

    if (!payment) {
      this.logger.warn(
        `No external payment found for terminal event, provider ${event.provider}, paymentId ${event.providerPaymentId}`,
      );
      return;
    }

    await this.externalPaymentCommand.updateWebhookMetadata({
      id: payment.id,
      providerEventId: event.providerEventId ?? undefined,
      lastWebhookEventId: event.providerEventId ?? undefined,
      lastWebhookReceivedAt: new Date(),
      status: event.status,
    });

    this.logger.debug(`Payment ${payment.id} transitioned to terminal status ${event.status}`);
  }
}
