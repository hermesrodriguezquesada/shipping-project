import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppConfigService } from 'src/core/config/config.service';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { REMITTANCE_COMMAND_PORT, REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';

@Injectable()
export class CreateRemittanceDraftUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
    private readonly config: AppConfigService,
  ) {}

  async execute(input: { senderUserId: string; beneficiaryId: string }): Promise<string> {
    const beneficiaryBelongsToUser = await this.remittanceQuery.beneficiaryBelongsToUser({
      beneficiaryId: input.beneficiaryId,
      ownerUserId: input.senderUserId,
    });

    if (!beneficiaryBelongsToUser) {
      throw new NotFoundDomainException('Beneficiary not found');
    }

    const minimumAmount = new Prisma.Decimal(this.config.remittanceAmountMin);

    return this.remittanceCommand.createDraft({
      senderUserId: input.senderUserId,
      beneficiaryId: input.beneficiaryId,
      amount: minimumAmount,
    });
  }
}
