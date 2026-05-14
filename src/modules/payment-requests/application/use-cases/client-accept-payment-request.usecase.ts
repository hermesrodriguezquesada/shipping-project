import { Inject, Injectable, Logger } from '@nestjs/common';
import { InternalNotificationType, PaymentRequestStatus, Role } from '@prisma/client';
import { DomainException } from '../../../../core/exceptions/domain/domain.exception';
import { UnauthorizedDomainException } from '../../../../core/exceptions/domain/unauthorized.exception';
import { InternalNotificationCommandPort } from '../../../internal-notifications/domain/ports/internal-notification-command.port';
import { UserQueryPort } from '../../../users/domain/ports/user-query.port';
import {
  INTERNAL_NOTIFICATION_COMMAND_PORT,
  PAYMENT_REQUEST_COMMAND_PORT,
  PAYMENT_REQUEST_QUERY_PORT,
  USER_QUERY_PORT,
} from '../../../../shared/constants/tokens';
import { PaymentRequestCommandPort } from '../../domain/ports/payment-request-command.port';
import { PaymentRequestQueryPort } from '../../domain/ports/payment-request-query.port';
import { PaymentRequestEntity } from '../../domain/entities/payment-request.entity';

@Injectable()
export class ClientAcceptPaymentRequestUseCase {
  private readonly logger = new Logger(ClientAcceptPaymentRequestUseCase.name);

  constructor(
    @Inject(PAYMENT_REQUEST_QUERY_PORT)
    private readonly query: PaymentRequestQueryPort,
    @Inject(PAYMENT_REQUEST_COMMAND_PORT)
    private readonly command: PaymentRequestCommandPort,
    @Inject(USER_QUERY_PORT)
    private readonly userQuery: UserQueryPort,
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly notificationCommand: InternalNotificationCommandPort,
  ) {}

  async execute(input: { userId: string; paymentRequestId: string }): Promise<{ entity: PaymentRequestEntity; transitioned: boolean }> {
    const request = await this.query.findByIdOrThrow(input.paymentRequestId);

    if (request.ownerUserId !== input.userId) {
      throw new UnauthorizedDomainException('You are not the owner of this payment request');
    }

    // Idempotent: already ACCEPTED — no side-effects
    if (request.status === PaymentRequestStatus.ACCEPTED) {
      return { entity: request, transitioned: false };
    }

    if (request.status !== PaymentRequestStatus.RENEGOTIATING) {
      throw new DomainException('Cannot accept: not in RENEGOTIATING status');
    }

    const updated = await this.command.updateStatus({
      id: request.id,
      status: PaymentRequestStatus.ACCEPTED,
    });

    await this.notifyAdminsSafe(updated.id);

    return { entity: updated, transitioned: true };
  }

  private async notifyAdminsSafe(referenceId: string): Promise<void> {
    try {
      const recipients = await this.userQuery.findMany(
        { role: Role.ADMIN, isDeleted: false },
        { limit: 200 },
      );
      await Promise.all(
        recipients.map((u) =>
          this.notificationCommand.create({
            userId: u.id,
            type: InternalNotificationType.PAYMENT_REQUEST_ACCEPTED,
            referenceId,
          }),
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Non-blocking notification failure for PAYMENT_REQUEST_ACCEPTED (admins). referenceId=${referenceId} error=${message}`);
    }
  }
}
