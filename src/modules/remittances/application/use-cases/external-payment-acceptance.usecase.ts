import { Inject, Injectable } from '@nestjs/common';
import { RemittanceStatus } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { REMITTANCE_COMMAND_PORT, REMITTANCE_QUERY_PORT, REMITTANCE_STATUS_NOTIFIER_PORT } from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';
import { RemittanceStatusNotifierPort } from '../../domain/ports/remittance-status-notifier.port';

/**
 * Internal route for external payment acceptance.
 * Maps external payment success to business payment confirmation,
 * preserving all side effects:
 * - status → PAID_SENDING_TO_RECEIVER
 * - totalGeneratedAmount increment
 * - PAYMENT_CONFIRMED event
 */
@Injectable()
export class ExternalPaymentAcceptanceUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
    @Inject(REMITTANCE_STATUS_NOTIFIER_PORT)
    private readonly notifier: RemittanceStatusNotifierPort,
  ) {}

  async execute(input: { remittanceId: string }): Promise<void> {
    const remittance = await this.remittanceQuery.findRemittanceById({ id: input.remittanceId });

    if (!remittance) {
      throw new NotFoundDomainException('Remittance not found');
    }

    if (remittance.status === RemittanceStatus.PAID_SENDING_TO_RECEIVER) {
      return;
    }

    if (
      remittance.status !== RemittanceStatus.PENDING_PAYMENT
      && remittance.status !== RemittanceStatus.PENDING_PAYMENT_CONFIRMATION
    ) {
      throw new ValidationDomainException(
        `Cannot accept external payment for remittance in status ${remittance.status}`,
      );
    }

    if (remittance.status === RemittanceStatus.PENDING_PAYMENT) {
      await this.remittanceCommand.markPaid({
        id: input.remittanceId,
        paymentDetails: 'External payment received',
      });
    }

    await this.remittanceCommand.confirmPayment({ id: input.remittanceId });

    await this.notifier.notifyStatusChange({
      to: remittance.sender.email,
      remittanceId: remittance.id,
      status: RemittanceStatus.PAID_SENDING_TO_RECEIVER,
      event: 'PAYMENT_CONFIRMED',
    });
  }
}
