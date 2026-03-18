import { Inject, Injectable, Logger } from '@nestjs/common';
import { RemittanceStatus } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  REMITTANCE_COMMAND_PORT,
  REMITTANCE_QUERY_PORT,
  REMITTANCE_STATUS_NOTIFIER_PORT,
} from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';
import {
  RemittanceStatusNotificationPayload,
  RemittanceStatusNotifierPort,
} from '../../domain/ports/remittance-status-notifier.port';

@Injectable()
export class RemittanceLifecycleUseCase {
  private readonly logger = new Logger(RemittanceLifecycleUseCase.name);

  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
    @Inject(REMITTANCE_STATUS_NOTIFIER_PORT)
    private readonly remittanceStatusNotifier: RemittanceStatusNotifierPort,
  ) {}

  async markPaid(input: { remittanceId: string; senderUserId: string; paymentDetails: string }): Promise<boolean> {
    const remittance = await this.remittanceQuery.findByIdAndSenderUser({
      id: input.remittanceId,
      senderUserId: input.senderUserId,
    });

    if (!remittance) throw new NotFoundDomainException('Remittance not found');
    if (remittance.status !== RemittanceStatus.PENDING_PAYMENT) {
      throw new ValidationDomainException('Only PENDING_PAYMENT remittances can be marked as paid');
    }

    const paymentDetails = input.paymentDetails?.trim();
    if (!paymentDetails) throw new ValidationDomainException('paymentDetails is required');

    await this.remittanceCommand.markPaid({ id: input.remittanceId, paymentDetails });
    await this.notifyStatusChange({
      to: remittance.senderEmail,
      remittanceId: remittance.id,
      status: RemittanceStatus.PENDING_PAYMENT_CONFIRMATION,
      event: 'PAYMENT_REPORTED',
    });
    return true;
  }

  async cancelMyRemittance(input: { remittanceId: string; senderUserId: string }): Promise<boolean> {
    const remittance = await this.remittanceQuery.findByIdAndSenderUser({
      id: input.remittanceId,
      senderUserId: input.senderUserId,
    });

    if (!remittance) throw new NotFoundDomainException('Remittance not found');
    if (remittance.status !== RemittanceStatus.PENDING_PAYMENT) {
      throw new ValidationDomainException('Only PENDING_PAYMENT remittances can be cancelled by client');
    }

    await this.remittanceCommand.cancelByClient({ id: input.remittanceId });
    await this.notifyStatusChange({
      to: remittance.senderEmail,
      remittanceId: remittance.id,
      status: RemittanceStatus.CANCELED_BY_CLIENT,
      event: 'CANCELLED_BY_CLIENT',
    });
    return true;
  }

  async adminConfirmRemittancePayment(remittanceId: string): Promise<boolean> {
    const remittance = await this.remittanceQuery.findRemittanceById({ id: remittanceId });

    if (!remittance) throw new NotFoundDomainException('Remittance not found');
    if (remittance.status !== RemittanceStatus.PENDING_PAYMENT_CONFIRMATION) {
      throw new ValidationDomainException('Only PENDING_PAYMENT_CONFIRMATION remittances can be confirmed');
    }

    await this.remittanceCommand.confirmPayment({ id: remittanceId });
    await this.notifyStatusChange({
      to: remittance.sender.email,
      remittanceId: remittance.id,
      status: RemittanceStatus.PAID_SENDING_TO_RECEIVER,
      event: 'PAYMENT_CONFIRMED',
    });
    return true;
  }

  async adminCancelRemittance(input: { remittanceId: string; statusDescription: string }): Promise<boolean> {
    const remittance = await this.remittanceQuery.findRemittanceById({ id: input.remittanceId });
    if (!remittance) throw new NotFoundDomainException('Remittance not found');

    const terminalStatuses = new Set<string>([
      RemittanceStatus.SUCCESS,
      RemittanceStatus.CANCELED_BY_ADMIN,
      RemittanceStatus.CANCELED_BY_CLIENT,
    ]);

    if (terminalStatuses.has(remittance.status)) {
      throw new ValidationDomainException('This remittance cannot be cancelled');
    }

    const statusDescription = input.statusDescription?.trim();
    if (!statusDescription) throw new ValidationDomainException('statusDescription is required');

    await this.remittanceCommand.cancelByAdmin({ id: input.remittanceId, statusDescription });
    await this.notifyStatusChange({
      to: remittance.sender.email,
      remittanceId: remittance.id,
      status: RemittanceStatus.CANCELED_BY_ADMIN,
      event: 'CANCELLED_BY_ADMIN',
      statusDescription,
    });
    return true;
  }

  async adminMarkRemittanceDelivered(remittanceId: string): Promise<boolean> {
    const remittance = await this.remittanceQuery.findRemittanceById({ id: remittanceId });
    if (!remittance) throw new NotFoundDomainException('Remittance not found');

    if (remittance.status !== RemittanceStatus.PAID_SENDING_TO_RECEIVER) {
      throw new ValidationDomainException('Only PAID_SENDING_TO_RECEIVER remittances can be delivered');
    }

    await this.remittanceCommand.markDelivered({ id: remittanceId });
    await this.notifyStatusChange({
      to: remittance.sender.email,
      remittanceId: remittance.id,
      status: RemittanceStatus.SUCCESS,
      event: 'REMITTANCE_DELIVERED',
    });
    return true;
  }

  private async notifyStatusChange(input: RemittanceStatusNotificationPayload): Promise<void> {
    const to = input.to?.trim();

    if (!to) {
      this.logger.warn(`Skipping remittance status email: missing owner email. remittanceId=${input.remittanceId}`);
      return;
    }

    try {
      await this.remittanceStatusNotifier.notifyStatusChange({ ...input, to });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Non-blocking remittance notification failure. remittanceId=${input.remittanceId} event=${input.event} error=${message}`,
      );
    }
  }
}
