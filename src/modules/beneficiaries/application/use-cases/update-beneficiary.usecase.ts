import { Inject, Injectable } from '@nestjs/common';
import { BENEFICIARY_COMMAND_PORT, BENEFICIARY_QUERY_PORT } from 'src/shared/constants/tokens';
import { BeneficiaryCommandPort } from '../../domain/ports/beneficiary-command.port';
import { BeneficiaryQueryPort } from '../../domain/ports/beneficiary-query.port';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { UpdateBeneficiaryDto } from '../dto/update-beneficiary.dto';

@Injectable()
export class UpdateBeneficiaryUseCase {
  constructor(
    @Inject(BENEFICIARY_QUERY_PORT)
    private readonly query: BeneficiaryQueryPort,
    @Inject(BENEFICIARY_COMMAND_PORT)
    private readonly commands: BeneficiaryCommandPort,
  ) {}

  async execute(input: UpdateBeneficiaryDto) {
    const existing = await this.query.findById({ id: input.id, ownerUserId: input.ownerUserId });
    if (!existing) throw new NotFoundDomainException('Beneficiary not found');

    return this.commands.update(input);
  }
}
