import { Injectable, Logger } from '@nestjs/common';
import { ExternalPaymentStatus, Prisma, ExternalPaymentProvider } from '@prisma/client';
import Stripe from 'stripe';
import { AppConfigService } from 'src/core/config/config.service';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  CanonicalExternalPaymentWebhookEvent,
  CreatePaymentSessionProviderInput,
  CreatePaymentSessionProviderResult,
  ExternalPaymentProviderPort,
  ParseAndVerifyWebhookInput,
} from '../../domain/ports/external-payment-provider.port';

@Injectable()
export class StripeExternalPaymentProviderAdapter implements ExternalPaymentProviderPort {
  private readonly logger = new Logger(StripeExternalPaymentProviderAdapter.name);

  constructor(private readonly config: AppConfigService) {}

  async createPaymentSession(input: CreatePaymentSessionProviderInput): Promise<CreatePaymentSessionProviderResult> {
    const stripe = this.getStripeClient();

    const currency = input.currencyCode.toLowerCase();
    const unitAmount = this.toMinorUnits(input.amount);
    const baseUrl = this.config.frontendUrl.replace(/\/+$/, '');

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        success_url: `${baseUrl}/payments/success?remittanceId=${input.remittanceId}`,
        cancel_url: `${baseUrl}/payments/cancel?remittanceId=${input.remittanceId}`,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: unitAmount,
              product_data: {
                name: `Remittance ${input.remittanceId}`,
              },
            },
          },
        ],
        metadata: {
          remittanceId: input.remittanceId,
          userId: input.userId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      {
        idempotencyKey: input.idempotencyKey,
      },
    );

    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;

    return {
      provider: input.provider,
      providerPaymentId: paymentIntentId,
      providerSessionId: session.id ?? null,
      checkoutUrl: session.url ?? null,
      status: ExternalPaymentStatus.PENDING,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null,
      metadataJson: {
        stripeSessionStatus: session.status,
      } as Prisma.InputJsonValue,
    };
  }

  async parseAndVerifyWebhook(input: ParseAndVerifyWebhookInput): Promise<CanonicalExternalPaymentWebhookEvent> {
    const secretKey = this.config.stripeWebhookSecret;

    if (!secretKey) {
      throw new ValidationDomainException('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const rawBodyBuffer = this.getRawBodyBuffer(input.rawBody);
    const signature = this.getSignatureHeader(input.headers);

    if (!signature) {
      throw new ValidationDomainException('Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(rawBodyBuffer, signature, secretKey);
    } catch (error) {
      this.logger.error('Stripe webhook signature verification failed:', error);
      throw new ValidationDomainException('Invalid webhook signature');
    }

    try {
      return this.canonicalizeStripeEvent(event);
    } catch (error) {
      this.logger.error('Error canonicalizing Stripe event:', error);
      throw error;
    }
  }

  private canonicalizeStripeEvent(event: Stripe.Event): CanonicalExternalPaymentWebhookEvent {
    const baseEvent: CanonicalExternalPaymentWebhookEvent = {
      provider: ExternalPaymentProvider.STRIPE,
      providerEventId: event.id,
      providerPaymentId: null,
      type: event.type,
      status: ExternalPaymentStatus.CREATED,
      occurredAt: event.created ? new Date(event.created * 1000) : new Date(),
      isTerminal: false,
      rawPayload: event,
    };

    if (event.type === 'charge.succeeded') {
      const charge = event.data.object as Stripe.Charge;
      return {
        ...baseEvent,
        providerPaymentId: charge.payment_intent as string | null,
        status: ExternalPaymentStatus.SUCCEEDED,
        isTerminal: true,
        metadata: {
          chargeId: charge.id,
          amount: charge.amount,
          currency: charge.currency,
        },
      };
    }

    if (event.type === 'charge.failed') {
      const charge = event.data.object as Stripe.Charge;
      return {
        ...baseEvent,
        providerPaymentId: charge.payment_intent as string | null,
        status: ExternalPaymentStatus.FAILED,
        isTerminal: true,
        metadata: {
          chargeId: charge.id,
          failureMessage: charge.failure_message,
        },
      };
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      return {
        ...baseEvent,
        providerPaymentId: charge.payment_intent as string | null,
        status: ExternalPaymentStatus.FAILED,
        isTerminal: true,
        metadata: {
          chargeId: charge.id,
          refundedAmount: charge.amount_refunded,
        },
      };
    }

    if (event.type === 'payment_intent.canceled') {
      const intent = event.data.object as Stripe.PaymentIntent;
      return {
        ...baseEvent,
        providerPaymentId: intent.id,
        status: ExternalPaymentStatus.CANCELED,
        isTerminal: true,
        metadata: {
          cancellationReason: intent.cancellation_reason,
        },
      };
    }

    if (
      event.type === 'payment_intent.payment_failed' ||
      event.type === 'payment_intent.amount_capturable_updated'
    ) {
      const intent = event.data.object as Stripe.PaymentIntent;
      return {
        ...baseEvent,
        providerPaymentId: intent.id,
        status: ExternalPaymentStatus.PENDING,
        isTerminal: false,
        metadata: {
          status: intent.status,
          amount: intent.amount,
        },
      };
    }

    this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    return baseEvent;
  }

  private getRawBodyBuffer(rawBody?: string | Buffer): Buffer {
    if (Buffer.isBuffer(rawBody)) {
      return rawBody;
    }

    if (typeof rawBody === 'string') {
      return Buffer.from(rawBody);
    }

    throw new ValidationDomainException('rawBody must be string or Buffer for webhook verification');
  }

  private getSignatureHeader(headers: Record<string, string | string[] | undefined>): string {
    const sig = headers['stripe-signature'];

    if (!sig) {
      return '';
    }

    if (Array.isArray(sig)) {
      return sig[0];
    }

    return sig;
  }

  private getStripeClient(): Stripe {
    const secretKey = this.config.stripeSecretKey;

    if (!secretKey) {
      throw new ValidationDomainException('STRIPE_SECRET_KEY is not configured');
    }

    return new Stripe(secretKey);
  }

  private toMinorUnits(amount: Prisma.Decimal): number {
    return Number(amount.mul(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toString());
  }
}

