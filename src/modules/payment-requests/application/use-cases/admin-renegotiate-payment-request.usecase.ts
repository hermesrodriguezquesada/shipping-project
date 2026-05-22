import { Inject, Injectable, Logger } from '@nestjs/common';
import { InternalNotificationType, PaymentRequestStatus, Prisma } from '@prisma/client';
import { DomainException } from '../../../../core/exceptions/domain/domain.exception';
import { ValidationDomainException } from '../../../../core/exceptions/domain/validation.exception';
import { InternalNotificationCommandPort } from '../../../internal-notifications/domain/ports/internal-notification-command.port';
import {
  INTERNAL_NOTIFICATION_COMMAND_PORT,
  PAYMENT_REQUEST_COMMAND_PORT,
  PAYMENT_REQUEST_QUERY_PORT,
} from '../../../../shared/constants/tokens';
import { PaymentRequestCommandPort } from '../../domain/ports/payment-request-command.port';
import { PaymentRequestQueryPort } from '../../domain/ports/payment-request-query.port';
import { PaymentRequestEntity } from '../../domain/entities/payment-request.entity';

@Injectable()
export class AdminRenegotiatePaymentRequestUseCase {
  private readonly logger = new Logger(AdminRenegotiatePaymentRequestUseCase.name);

  constructor(
    @Inject(PAYMENT_REQUEST_QUERY_PORT)
    private readonly query: PaymentRequestQueryPort,
    @Inject(PAYMENT_REQUEST_COMMAND_PORT)
    private readonly command: PaymentRequestCommandPort,
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly notificationCommand: InternalNotificationCommandPort,
  ) {}

  async execute(input: {
    adminUserId: string;
    paymentRequestId: string;
    newAmount: string;
    reason?: string;
  }): Promise<{ entity: PaymentRequestEntity; transitioned: boolean }> {
    const request = await this.query.findByIdOrThrow(input.paymentRequestId);

    const newAmountDecimal = new Prisma.Decimal(input.newAmount);

    // Idempotent: already RENEGOTIATING with the exact same newAmount — no side-effects
    if (
      request.status === PaymentRequestStatus.RENEGOTIATING &&
      request.newAmount !== null &&
      request.newAmount.equals(newAmountDecimal)
    ) {
      return { entity: request, transitioned: false };
    }

    if (request.status !== PaymentRequestStatus.REQUESTED) {
      throw new DomainException('Can only renegotiate from REQUESTED status');
    }

    if (!newAmountDecimal.gt(0)) {
      throw new ValidationDomainException('newAmount must be greater than 0');
    }
    if (newAmountDecimal.gt(request.amount)) {
      throw new ValidationDomainException('newAmount must not exceed original amount');
    }

    // Recalculate amountToPay in USD using the stored exchange rate and delivery fee
    const newAmountUsd = newAmountDecimal.div(request.exchangeRate);
    const newAmountToPay = newAmountUsd.minus(request.deliveryFee);
    if (request.deliveryFee.gt(0) && !newAmountToPay.gt(0)) {
      throw new ValidationDomainException('newAmount must be greater than delivery fee');
    }

    const updated = await this.command.renegotiate({
      id: request.id,
      newAmount: newAmountDecimal,
      amountToPay: newAmountToPay,
      reviewedById: input.adminUserId,
      reviewedAt: new Date(),
      canceledReason: input.reason ?? null,
    });

    await this.notifyOwnerSafe(updated.ownerUserId, updated.id);

    return { entity: updated, transitioned: true };
  }

  private async notifyOwnerSafe(userId: string, referenceId: string): Promise<void> {
    try {
      await this.notificationCommand.create({
        userId,
        type: InternalNotificationType.PAYMENT_REQUEST_RENEGOTIATED,
        referenceId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Non-blocking notification failure for PAYMENT_REQUEST_RENEGOTIATED. referenceId=${referenceId} error=${message}`);
    }
  }
}
