import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceQueryPort, RemittanceReadModel } from '../../domain/ports/remittance-query.port';
import { CreateRemittanceDraftUseCase } from './create-remittance-draft.usecase';

@Injectable()
export class CreateRemittanceDraftV2UseCase {
  constructor(
    private readonly createRemittanceDraftUseCase: CreateRemittanceDraftUseCase,
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
  ) {}

  async execute(input: { senderUserId: string; beneficiaryId: string }): Promise<RemittanceReadModel> {
    const remittanceId = await this.createRemittanceDraftUseCase.execute(input);

    const remittance = await this.remittanceQuery.findMyRemittanceById({
      id: remittanceId,
      senderUserId: input.senderUserId,
    });

    if (!remittance) {
      throw new NotFoundDomainException('Remittance not found');
    }

    return remittance;
  }
}
