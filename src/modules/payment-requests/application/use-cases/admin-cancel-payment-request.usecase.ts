import { Inject, Injectable, Logger } from '@nestjs/common';
import { InternalNotificationType, PaymentRequestStatus } from '@prisma/client';
import { DomainException } from '../../../../core/exceptions/domain/domain.exception';
import { InternalNotificationCommandPort } from '../../../internal-notifications/domain/ports/internal-notification-command.port';
import {
  INTERNAL_NOTIFICATION_COMMAND_PORT,
  PAYMENT_REQUEST_COMMAND_PORT,
  PAYMENT_REQUEST_QUERY_PORT,
} from '../../../../shared/constants/tokens';
import { PaymentRequestCommandPort } from '../../domain/ports/payment-request-command.port';
import { PaymentRequestQueryPort } from '../../domain/ports/payment-request-query.port';
import { PaymentRequestEntity } from '../../domain/entities/payment-request.entity';

const CANCELABLE_BY_ADMIN: PaymentRequestStatus[] = [
  PaymentRequestStatus.REQUESTED,
  PaymentRequestStatus.RENEGOTIATING,
  PaymentRequestStatus.ACCEPTED,
];

@Injectable()
export class AdminCancelPaymentRequestUseCase {
  private readonly logger = new Logger(AdminCancelPaymentRequestUseCase.name);

  constructor(
    @Inject(PAYMENT_REQUEST_QUERY_PORT)
    private readonly query: PaymentRequestQueryPort,
    @Inject(PAYMENT_REQUEST_COMMAND_PORT)
    private readonly command: PaymentRequestCommandPort,
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly notificationCommand: InternalNotificationCommandPort,
  ) {}

  async execute(input: { adminUserId: string; paymentRequestId: string; reason?: string }): Promise<{ entity: PaymentRequestEntity; transitioned: boolean }> {
    const request = await this.query.findByIdOrThrow(input.paymentRequestId);

    // Idempotent: already CANCELED_BY_ADMIN — no side-effects
    if (request.status === PaymentRequestStatus.CANCELED_BY_ADMIN) {
      return { entity: request, transitioned: false };
    }

    if (!CANCELABLE_BY_ADMIN.includes(request.status)) {
      throw new DomainException(`Cannot cancel from status ${request.status}`);
    }

    const updated = await this.command.updateStatus({
      id: request.id,
      status: PaymentRequestStatus.CANCELED_BY_ADMIN,
      canceledReason: input.reason ?? null,
      reviewedById: input.adminUserId,
      reviewedAt: new Date(),
    });

    await this.notifyOwnerSafe(updated.ownerUserId, updated.id);

    return { entity: updated, transitioned: true };
  }

  private async notifyOwnerSafe(userId: string, referenceId: string): Promise<void> {
    try {
      await this.notificationCommand.create({
        userId,
        type: InternalNotificationType.PAYMENT_REQUEST_CANCELED_BY_ADMIN,
        referenceId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Non-blocking notification failure for PAYMENT_REQUEST_CANCELED_BY_ADMIN. referenceId=${referenceId} error=${message}`);
    }
  }
}
