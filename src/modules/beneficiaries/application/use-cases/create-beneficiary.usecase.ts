import { Inject, Injectable } from '@nestjs/common';
import { BENEFICIARY_COMMAND_PORT } from 'src/shared/constants/tokens';
import { BeneficiaryCommandPort } from '../../domain/ports/beneficiary-command.port';
import { CreateBeneficiaryDto } from '../dto/create-beneficiary.dto';

@Injectable()
export class CreateBeneficiaryUseCase {
  constructor(
    @Inject(BENEFICIARY_COMMAND_PORT)
    private readonly commands: BeneficiaryCommandPort,
  ) {}

  execute(input: CreateBeneficiaryDto) {
    return this.commands.create(input);
  }
}
