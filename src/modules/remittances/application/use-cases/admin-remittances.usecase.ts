import { Inject, Injectable } from '@nestjs/common';
import { REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceQueryPort, RemittanceReadModel } from '../../domain/ports/remittance-query.port';

@Injectable()
export class AdminRemittancesUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
  ) {}

  list(input: { limit?: number; offset?: number }): Promise<RemittanceReadModel[]> {
    return this.remittanceQuery.listRemittances(input);
  }

  listByUser(input: { userId: string; limit?: number; offset?: number }): Promise<RemittanceReadModel[]> {
    return this.remittanceQuery.listRemittancesByUser(input);
  }

  getById(id: string): Promise<RemittanceReadModel | null> {
    return this.remittanceQuery.findRemittanceById({ id });
  }
}
