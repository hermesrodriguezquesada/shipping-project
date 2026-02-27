import { Inject, Injectable } from '@nestjs/common';
import { REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceQueryPort, RemittanceReadModel } from '../../domain/ports/remittance-query.port';

@Injectable()
export class ListMyRemittancesUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
  ) {}

  async execute(input: { senderUserId: string; limit?: number; offset?: number }): Promise<RemittanceReadModel[]> {
    return this.remittanceQuery.listMyRemittances({
      senderUserId: input.senderUserId,
      limit: input.limit,
      offset: input.offset,
    });
  }
}
