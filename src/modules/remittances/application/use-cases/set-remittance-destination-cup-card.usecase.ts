import { Inject, Injectable } from '@nestjs/common';
import { ReceptionMethod, RemittanceStatus } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { REMITTANCE_COMMAND_PORT, REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';

@Injectable()
export class SetRemittanceDestinationCupCardUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
  ) {}

  async execute(input: {
    remittanceId: string;
    senderUserId: string;
    destinationCupCardNumber: string;
  }): Promise<boolean> {
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

    if (remittance.receptionMethodCode !== ReceptionMethod.CUP_TRANSFER) {
      throw new ValidationDomainException('destinationCupCardNumber is only allowed for CUP_TRANSFER');
    }

    const destinationCupCardNumber = input.destinationCupCardNumber?.trim();

    if (!destinationCupCardNumber) {
      throw new ValidationDomainException('destinationCupCardNumber is required');
    }

    await this.remittanceCommand.setDestinationCupCard({
      id: input.remittanceId,
      destinationCupCardNumber,
    });

    return true;
  }
}
