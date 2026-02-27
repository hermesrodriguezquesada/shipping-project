import { Inject, Injectable } from '@nestjs/common';
import { RemittanceStatus } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { REMITTANCE_COMMAND_PORT, REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';

@Injectable()
export class SetRemittanceReceivingCurrencyUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
  ) {}

  async execute(input: { remittanceId: string; senderUserId: string; currencyCode: string }): Promise<boolean> {
    const remittance = await this.remittanceQuery.findByIdAndSenderUser({
      id: input.remittanceId,
      senderUserId: input.senderUserId,
    });

    if (!remittance) {
      throw new NotFoundDomainException('Remittance not found');
    }

    if (remittance.status !== RemittanceStatus.DRAFT) {
      throw new ValidationDomainException('Only DRAFT remittances can be updated');
    }

    const code = input.currencyCode?.trim().toUpperCase();
    if (!code) {
      throw new ValidationDomainException('currencyCode is required');
    }

    const currency = await this.remittanceQuery.findCurrencyByCode({ code });
    if (!currency || !currency.enabled) {
      throw new ValidationDomainException('currencyCode is not enabled');
    }

    await this.remittanceCommand.setReceivingCurrency({
      id: input.remittanceId,
      receivingCurrencyId: currency.id,
    });

    return true;
  }
}
