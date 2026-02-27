import { Inject, Injectable } from '@nestjs/common';
import { ReceptionMethod, RemittanceStatus } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { RECEPTION_METHOD_AVAILABILITY_PORT, REMITTANCE_COMMAND_PORT, REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { ReceptionMethodAvailabilityPort } from '../../domain/ports/reception-method-availability.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';

@Injectable()
export class SetRemittanceReceptionMethodUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
    @Inject(RECEPTION_METHOD_AVAILABILITY_PORT)
    private readonly receptionMethodAvailability: ReceptionMethodAvailabilityPort,
  ) {}

  async execute(input: {
    remittanceId: string;
    senderUserId: string;
    receptionMethod: ReceptionMethod;
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

    const receptionMethod = await this.receptionMethodAvailability.findEnabledReceptionMethodByCode({
      code: input.receptionMethod,
    });

    if (!receptionMethod) {
      throw new ValidationDomainException('receptionMethod is not enabled');
    }

    await this.remittanceCommand.setReceptionMethod({
      id: input.remittanceId,
      receptionMethodCode: input.receptionMethod,
      destinationCupCardNumber:
        input.receptionMethod === ReceptionMethod.CUP_TRANSFER ? remittance.destinationCupCardNumber : null,
    });

    return true;
  }
}
