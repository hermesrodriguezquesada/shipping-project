import { Inject, Injectable } from '@nestjs/common';
import { BENEFICIARY_QUERY_PORT } from 'src/shared/constants/tokens';
import { BeneficiaryQueryPort } from '../../domain/ports/beneficiary-query.port';
import { ListBeneficiariesDto } from '../dto/list-beneficiaries.dto';

@Injectable()
export class ListMyBeneficiariesUseCase {
  constructor(
    @Inject(BENEFICIARY_QUERY_PORT)
    private readonly query: BeneficiaryQueryPort,
  ) {}

  execute(input: ListBeneficiariesDto) {
    return this.query.listByOwner({
      ownerUserId: input.ownerUserId,
      offset: input.offset ?? 0,
      limit: input.limit ?? 50,
      includeDeleted: input.includeDeleted ?? false,
    });
  }
}
