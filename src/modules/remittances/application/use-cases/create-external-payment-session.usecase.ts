import { Inject, Injectable } from '@nestjs/common';
import { ExternalPaymentProvider, ExternalPaymentStatus, PaymentMethodType, Prisma, RemittanceStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  EXTERNAL_PAYMENT_COMMAND_PORT,
  EXTERNAL_PAYMENT_PROVIDER_PORT,
  EXTERNAL_PAYMENT_QUERY_PORT,
  REMITTANCE_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { ExternalPaymentCommandPort } from '../../domain/ports/external-payment-command.port';
import { ExternalPaymentProviderPort } from '../../domain/ports/external-payment-provider.port';
import { ExternalPaymentQueryPort } from '../../domain/ports/external-payment-query.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';

export interface CreateExternalPaymentSessionResult {
  paymentId: string;
  provider: ExternalPaymentProvider;
  status: ExternalPaymentStatus;
  checkoutUrl: string | null;
  expiresAt: Date | null;
}

@Injectable()
export class CreateExternalPaymentSessionUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(EXTERNAL_PAYMENT_QUERY_PORT)
    private readonly externalPaymentQuery: ExternalPaymentQueryPort,
    @Inject(EXTERNAL_PAYMENT_COMMAND_PORT)
    private readonly externalPaymentCommand: ExternalPaymentCommandPort,
    @Inject(EXTERNAL_PAYMENT_PROVIDER_PORT)
    private readonly externalPaymentProvider: ExternalPaymentProviderPort,
  ) {}

  async execute(input: { remittanceId: string; senderUserId: string }): Promise<CreateExternalPaymentSessionResult> {
    const remittance = await this.remittanceQuery.findMyRemittanceById({
      id: input.remittanceId,
      senderUserId: input.senderUserId,
    });

    if (!remittance) {
      throw new NotFoundDomainException('Remittance not found');
    }

    if (remittance.status !== RemittanceStatus.PENDING_PAYMENT) {
      throw new ValidationDomainException('Only PENDING_PAYMENT remittances can create external payment sessions');
    }

    const paymentMethod = remittance.paymentMethod;
    if (!paymentMethod) {
      throw new ValidationDomainException('Remittance payment method is required');
    }

    if (!paymentMethod.enabled) {
      throw new ValidationDomainException('Remittance payment method is disabled');
    }

    if (paymentMethod.type !== PaymentMethodType.PLATFORM) {
      throw new ValidationDomainException('Only PLATFORM payment methods support external payment sessions');
    }

    if (!remittance.paymentCurrency?.code) {
      throw new ValidationDomainException('Remittance payment currency is required');
    }

    const provider = this.resolveProvider(paymentMethod.code);

    const reusableSession = await this.externalPaymentQuery.findReusableActiveSession({
      remittanceId: remittance.id,
      provider,
    });

    if (reusableSession) {
      return {
        paymentId: reusableSession.id,
        provider: reusableSession.provider,
        status: reusableSession.status,
        checkoutUrl: reusableSession.checkoutUrl,
        expiresAt: reusableSession.expiresAt,
      };
    }

    const idempotencyKey = randomUUID();

    const createdPayment = await this.externalPaymentCommand.create({
      remittanceId: remittance.id,
      provider,
      status: ExternalPaymentStatus.CREATED,
      amount: remittance.amount,
      currencyCode: remittance.paymentCurrency.code,
      idempotencyKey,
      metadataJson: {
        paymentMethodCode: paymentMethod.code,
      } as Prisma.InputJsonValue,
    });

    const providerResult = await this.externalPaymentProvider.createPaymentSession({
      provider,
      amount: remittance.amount,
      currencyCode: remittance.paymentCurrency.code,
      idempotencyKey,
      remittanceId: remittance.id,
      userId: input.senderUserId,
      metadataJson: {
        paymentMethodCode: paymentMethod.code,
      } as Prisma.InputJsonValue,
    });

    const updatedPayment = await this.externalPaymentCommand.updateSessionData({
      id: createdPayment.id,
      providerPaymentId: providerResult.providerPaymentId,
      providerSessionId: providerResult.providerSessionId,
      checkoutUrl: providerResult.checkoutUrl,
      status: providerResult.status,
      expiresAt: providerResult.expiresAt,
      metadataJson: providerResult.metadataJson,
    });

    return {
      paymentId: updatedPayment.id,
      provider: updatedPayment.provider,
      status: updatedPayment.status,
      checkoutUrl: updatedPayment.checkoutUrl,
      expiresAt: updatedPayment.expiresAt,
    };
  }

  private resolveProvider(paymentMethodCode: string): ExternalPaymentProvider {
    if (paymentMethodCode.toUpperCase() === 'STRIPE') {
      return ExternalPaymentProvider.STRIPE;
    }

    throw new ValidationDomainException(`Unsupported external payment provider for payment method ${paymentMethodCode}`);
  }
}
