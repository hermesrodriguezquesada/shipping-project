import { Inject, Injectable } from '@nestjs/common';
import { BENEFICIARY_QUERY_PORT } from 'src/shared/constants/tokens';
import { BeneficiaryQueryPort } from '../../domain/ports/beneficiary-query.port';

@Injectable()
export class ListMyBeneficiariesUseCase {
  constructor(
    @Inject(BENEFICIARY_QUERY_PORT)
    private readonly query: BeneficiaryQueryPort,
  ) {}

  execute(ownerUserId: string, pagination?: { offset?: number; limit?: number }) {
    return this.query.listByOwner({
      ownerUserId,
      offset: pagination?.offset ?? 0,
      limit: pagination?.limit ?? 50,
    });
  }
}
