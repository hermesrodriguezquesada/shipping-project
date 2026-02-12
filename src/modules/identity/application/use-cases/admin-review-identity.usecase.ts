import { Inject, Injectable } from '@nestjs/common';
import { IdentityCommandPort } from '../../domain/ports/identity-command.port';
import { IDENTITY_COMMAND_PORT } from 'src/shared/constants/tokens';
import { IdentityStatus } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';

@Injectable()
export class AdminReviewIdentityUseCase {
  constructor(
    @Inject(IDENTITY_COMMAND_PORT) 
    private readonly identity: IdentityCommandPort
  ) {}

  async execute(input: { userId: string; status: IdentityStatus; reviewedById: string; rejectionReason?: string }) {
    if (input.status === IdentityStatus.REJECTED && !input.rejectionReason) {
      throw new ValidationDomainException('rejectionReason is required when rejecting');
    }
    await this.identity.review(input);
    return true;
  }
}
