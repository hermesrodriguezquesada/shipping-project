import { Inject, Injectable } from '@nestjs/common';
import { IdentityCommandPort } from '../../domain/ports/identity-command.port';
import { IDENTITY_COMMAND_PORT } from 'src/shared/constants/tokens';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';

@Injectable()
export class SubmitIdentityUseCase {
  constructor(
    @Inject(IDENTITY_COMMAND_PORT) 
    private readonly identity: IdentityCommandPort
  ) {}

  async execute(input: any & { userId: string }) {
    if (!input.documentType || !input.documentNumber || !input.fullName) {
      throw new ValidationDomainException('Missing required identity fields');
    }
    await this.identity.upsertSubmission(input);
    return true;
  }
}
