import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InternalNotificationType, RemittanceStatus } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  REMITTANCE_COMMAND_PORT,
  INTERNAL_NOTIFICATION_COMMAND_PORT,
  REMITTANCE_PAYMENT_PROOF_STORAGE_PORT,
  REMITTANCE_QUERY_PORT,
  REMITTANCE_STATUS_NOTIFIER_PORT,
} from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';
import { RemittancePaymentProofStoragePort } from '../../domain/ports/remittance-payment-proof-storage.port';
import {
  RemittanceStatusNotificationPayload,
  RemittanceStatusNotifierPort,
} from '../../domain/ports/remittance-status-notifier.port';
import { buildPaymentDetailsProofJson } from '../utils/payment-details-proof';
import { InternalNotificationCommandPort } from 'src/modules/internal-notifications/domain/ports/internal-notification-command.port';

const ALLOWED_PAYMENT_PROOF_MIME_TYPES = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);
const MAX_PAYMENT_PROOF_SIZE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class RemittanceLifecycleUseCase {
  private readonly logger = new Logger(RemittanceLifecycleUseCase.name);

  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
    @Inject(REMITTANCE_PAYMENT_PROOF_STORAGE_PORT)
    private readonly paymentProofStorage: RemittancePaymentProofStoragePort,
    @Inject(REMITTANCE_STATUS_NOTIFIER_PORT)
    private readonly remittanceStatusNotifier: RemittanceStatusNotifierPort,
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly internalNotificationCommand: InternalNotificationCommandPort,
  ) {}

  async markPaid(input: {
    remittanceId: string;
    senderUserId: string;
    paymentDetails?: string | null;
    paymentProofImg?: string | null;
    accountHolderName?: string | null;
  }): Promise<boolean> {
    const remittance = await this.remittanceQuery.findByIdAndSenderUser({
      id: input.remittanceId,
      senderUserId: input.senderUserId,
    });

    if (!remittance) throw new NotFoundDomainException('Remittance not found');
    if (remittance.status !== RemittanceStatus.PENDING_PAYMENT) {
      throw new ValidationDomainException('Only PENDING_PAYMENT remittances can be marked as paid');
    }

    const legacyPaymentDetails = input.paymentDetails?.trim();
    const paymentProofImg = input.paymentProofImg?.trim();
    const accountHolderName = input.accountHolderName?.trim();

    let paymentDetailsToPersist: string;

    const usingProofPayload = Boolean(paymentProofImg || accountHolderName);

    if (usingProofPayload) {
      if (!paymentProofImg) {
        throw new ValidationDomainException('paymentProofImg is required');
      }

      if (!accountHolderName) {
        throw new ValidationDomainException('accountHolderName is required');
      }

      const { mimeType, extension, body } = this.parsePaymentProofImage(paymentProofImg);
      const paymentProofKey = `remittances/${input.remittanceId}/payment-proof/${randomUUID()}${extension}`;

      await this.paymentProofStorage.uploadObject({ key: paymentProofKey, mimeType, body });

      paymentDetailsToPersist = buildPaymentDetailsProofJson({
        paymentProofKey,
        accountHolderName,
      });
    } else {
      if (!legacyPaymentDetails) {
        throw new ValidationDomainException('paymentDetails is required');
      }

      paymentDetailsToPersist = legacyPaymentDetails;
    }

    await this.remittanceCommand.markPaid({ id: input.remittanceId, paymentDetails: paymentDetailsToPersist });
    await this.createInternalNotificationSafe({
      userId: input.senderUserId,
      type: InternalNotificationType.REMITTANCE_PENDING_CONFIRMATION_PAYMENT,
      referenceId: remittance.id,
    });
    await this.notifyStatusChange({
      to: remittance.senderEmail,
      remittanceId: remittance.id,
      status: RemittanceStatus.PENDING_PAYMENT_CONFIRMATION,
      event: 'PAYMENT_REPORTED',
    });
    return true;
  }

  private parsePaymentProofImage(input: string): {
    mimeType: string;
    extension: string;
    body: Buffer;
  } {
    const matches = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\r\n]+)$/i.exec(input);
    if (!matches) {
      throw new ValidationDomainException('paymentProofImg must be a valid base64 data URL');
    }

    const mimeType = matches[1].toLowerCase();
    const extension = ALLOWED_PAYMENT_PROOF_MIME_TYPES.get(mimeType);
    if (!extension) {
      throw new ValidationDomainException('Unsupported payment proof mimeType');
    }

    const base64Payload = matches[2].replace(/\s+/g, '');
    const body = Buffer.from(base64Payload, 'base64');

    if (!body.length) {
      throw new ValidationDomainException('paymentProofImg content is empty');
    }

    if (body.length > MAX_PAYMENT_PROOF_SIZE_BYTES) {
      throw new ValidationDomainException(
        `payment proof size must be between 1 and ${MAX_PAYMENT_PROOF_SIZE_BYTES} bytes`,
      );
    }

    return { mimeType, extension, body };
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

  private async createInternalNotificationSafe(input: {
    userId: string;
    type: InternalNotificationType;
    referenceId: string;
  }): Promise<void> {
    try {
      await this.internalNotificationCommand.create({
        userId: input.userId,
        type: input.type,
        referenceId: input.referenceId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Non-blocking internal notification failure. userId=${input.userId} type=${input.type} referenceId=${input.referenceId} error=${message}`,
      );
    }
  }
}
