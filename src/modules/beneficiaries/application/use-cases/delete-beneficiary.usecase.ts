import { Inject, Injectable } from '@nestjs/common';
import { BENEFICIARY_COMMAND_PORT, BENEFICIARY_QUERY_PORT } from 'src/shared/constants/tokens';
import { BeneficiaryCommandPort } from '../../domain/ports/beneficiary-command.port';
import { BeneficiaryQueryPort } from '../../domain/ports/beneficiary-query.port';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';

@Injectable()
export class DeleteBeneficiaryUseCase {
  constructor(
    @Inject(BENEFICIARY_QUERY_PORT) private readonly query: BeneficiaryQueryPort,
    @Inject(BENEFICIARY_COMMAND_PORT) private readonly commands: BeneficiaryCommandPort,
  ) {}

  async execute(input: { id: string; ownerUserId: string }) {
    const existing = await this.query.findById(input);
    if (!existing) throw new NotFoundDomainException('Beneficiary not found');
    await this.commands.softDelete(input);
    return true;
  }
}
