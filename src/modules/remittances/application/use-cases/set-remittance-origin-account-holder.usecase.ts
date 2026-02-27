import { Inject, Injectable } from '@nestjs/common';
import { OriginAccountHolderType, RemittanceStatus } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { REMITTANCE_COMMAND_PORT, REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';

@Injectable()
export class SetRemittanceOriginAccountHolderUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
  ) {}

  async execute(input: {
    remittanceId: string;
    senderUserId: string;
    holderType: OriginAccountHolderType;
    firstName?: string;
    lastName?: string;
    companyName?: string;
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

    const firstName = input.firstName?.trim() ?? null;
    const lastName = input.lastName?.trim() ?? null;
    const companyName = input.companyName?.trim() ?? null;

    if (input.holderType === OriginAccountHolderType.PERSON) {
      if (!firstName || !lastName) {
        throw new ValidationDomainException('firstName and lastName are required for PERSON');
      }

      await this.remittanceCommand.setOriginAccountHolder({
        id: input.remittanceId,
        originAccountHolderType: input.holderType,
        originAccountHolderFirstName: firstName,
        originAccountHolderLastName: lastName,
        originAccountHolderCompanyName: null,
      });

      return true;
    }

    if (!companyName) {
      throw new ValidationDomainException('companyName is required for COMPANY');
    }

    await this.remittanceCommand.setOriginAccountHolder({
      id: input.remittanceId,
      originAccountHolderType: input.holderType,
      originAccountHolderFirstName: null,
      originAccountHolderLastName: null,
      originAccountHolderCompanyName: companyName,
    });

    return true;
  }
}
