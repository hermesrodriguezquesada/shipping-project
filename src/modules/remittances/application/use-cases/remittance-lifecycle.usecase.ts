import { Inject, Injectable } from '@nestjs/common';
import { RemittanceStatus } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { REMITTANCE_COMMAND_PORT, REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';

@Injectable()
export class RemittanceLifecycleUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
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
    return true;
  }

  async adminConfirmRemittancePayment(remittanceId: string): Promise<boolean> {
    const remittance = await this.remittanceQuery.findRemittanceById({ id: remittanceId });

    if (!remittance) throw new NotFoundDomainException('Remittance not found');
    if (remittance.status !== RemittanceStatus.PENDING_PAYMENT_CONFIRMATION) {
      throw new ValidationDomainException('Only PENDING_PAYMENT_CONFIRMATION remittances can be confirmed');
    }

    await this.remittanceCommand.confirmPayment({ id: remittanceId });
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
    return true;
  }

  async adminMarkRemittanceDelivered(remittanceId: string): Promise<boolean> {
    const remittance = await this.remittanceQuery.findRemittanceById({ id: remittanceId });
    if (!remittance) throw new NotFoundDomainException('Remittance not found');

    if (remittance.status !== RemittanceStatus.PAID_SENDING_TO_RECEIVER) {
      throw new ValidationDomainException('Only PAID_SENDING_TO_RECEIVER remittances can be delivered');
    }

    await this.remittanceCommand.markDelivered({ id: remittanceId });
    return true;
  }
}
