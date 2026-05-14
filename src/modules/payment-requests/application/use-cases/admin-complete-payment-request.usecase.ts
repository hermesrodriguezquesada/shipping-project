import { Inject, Injectable, Logger } from '@nestjs/common';
import { InternalNotificationType, PaymentRequestStatus } from '@prisma/client';
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
export class AdminCompletePaymentRequestUseCase {
  private readonly logger = new Logger(AdminCompletePaymentRequestUseCase.name);

  constructor(
    @Inject(PAYMENT_REQUEST_QUERY_PORT)
    private readonly query: PaymentRequestQueryPort,
    @Inject(PAYMENT_REQUEST_COMMAND_PORT)
    private readonly command: PaymentRequestCommandPort,
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly notificationCommand: InternalNotificationCommandPort,
  ) {}

  async execute(input: { adminUserId: string; paymentRequestId: string }): Promise<{ entity: PaymentRequestEntity; transitioned: boolean }> {
    const request = await this.query.findByIdOrThrow(input.paymentRequestId);

    // Idempotent: already PAID — no side-effects
    if (request.status === PaymentRequestStatus.PAID) {
      return { entity: request, transitioned: false };
    }

    // Only ACCEPTED can be completed
    if (request.status !== PaymentRequestStatus.ACCEPTED) {
      throw new Error(`Cannot complete payment request in status ${request.status}`);
    }

    const completed = await this.command.completeAndDecrementBalance({
      id: request.id,
      paidById: input.adminUserId,
    });

    await this.notifyOwnerSafe(completed.ownerUserId, completed.id);

    return { entity: completed, transitioned: true };
  }

  private async notifyOwnerSafe(userId: string, referenceId: string): Promise<void> {
    try {
      await this.notificationCommand.create({
        userId,
        type: InternalNotificationType.PAYMENT_REQUEST_PAID,
        referenceId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Non-blocking notification failure for PAYMENT_REQUEST_PAID. referenceId=${referenceId} error=${message}`);
    }
  }
}
