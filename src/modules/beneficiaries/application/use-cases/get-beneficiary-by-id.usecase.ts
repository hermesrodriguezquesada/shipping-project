import { Inject, Injectable } from '@nestjs/common';
import { BENEFICIARY_QUERY_PORT } from 'src/shared/constants/tokens';
import { BeneficiaryQueryPort } from '../../domain/ports/beneficiary-query.port';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';

@Injectable()
export class GetBeneficiaryByIdUseCase {
  constructor(
    @Inject(BENEFICIARY_QUERY_PORT)
    private readonly query: BeneficiaryQueryPort,
  ) {}

  async execute(input: { id: string; ownerUserId: string }) {
    const row = await this.query.findById(input);
    if (!row) throw new NotFoundDomainException('Beneficiary not found');
    return row;
  }
}
