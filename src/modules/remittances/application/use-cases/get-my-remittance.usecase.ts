import { Inject, Injectable } from '@nestjs/common';
import { REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceQueryPort, RemittanceReadModel } from '../../domain/ports/remittance-query.port';

@Injectable()
export class GetMyRemittanceUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
  ) {}

  async execute(input: { senderUserId: string; remittanceId: string }): Promise<RemittanceReadModel | null> {
    return this.remittanceQuery.findMyRemittanceById({
      senderUserId: input.senderUserId,
      id: input.remittanceId,
    });
  }
}
