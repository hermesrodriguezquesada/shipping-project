import { Controller, Post, Param, Body, Headers, Logger, Req } from '@nestjs/common';
import { Request } from 'express';
import { ExternalPaymentProvider } from '@prisma/client';
import { HandleExternalPaymentWebhookUseCase } from '../../../application/use-cases/handle-external-payment-webhook.usecase';

/**
 * HTTP endpoint for external payment provider webhooks.
 * 
 * Route: POST /payments/webhooks/:provider
 * 
 * Handles callbacks from payment providers (Stripe, etc.)
 * for payment status updates.
 */
@Controller('payments/webhooks')
export class ExternalPaymentWebhookController {
  private readonly logger = new Logger(ExternalPaymentWebhookController.name);

  constructor(
    private readonly handleWebhookUseCase: HandleExternalPaymentWebhookUseCase,
  ) {}

  @Post(':provider')
  async handleWebhook(
    @Param('provider') providerParam: string,
    @Body() body: unknown,
    @Headers() headers: Record<string, string | string[]>,
    @Req() request: Request & { rawBody?: Buffer },
  ): Promise<{ statusCode: number; message: string }> {
    const provider = this.normalizeProvider(providerParam);

    if (!this.isValidProvider(provider)) {
      this.logger.warn(`Invalid provider in webhook: ${providerParam}`);
      return { statusCode: 400, message: 'Invalid provider' };
    }

    const rawBody = request.rawBody;

    this.logger.debug(`Received webhook from provider ${provider}`);

    try {
      await this.handleWebhookUseCase.execute({
        provider,
        headers,
        body,
        rawBody,
      });

      return { statusCode: 200, message: 'Webhook processed' };
    } catch (error) {
      this.logger.error(`Error processing webhook from ${provider}:`, error);
      return { statusCode: 202, message: 'Webhook received (error during processing, will retry)' };
    }
  }

  private normalizeProvider(param: string): ExternalPaymentProvider {
    const upper = param.toUpperCase();
    if (upper === 'STRIPE') return ExternalPaymentProvider.STRIPE;
    return upper as any;
  }

  private isValidProvider(provider: any): boolean {
    return Object.values(ExternalPaymentProvider).includes(provider);
  }
}
