import { Inject, Injectable } from '@nestjs/common';
import { USER_COMMAND_PORT, USER_QUERY_PORT } from 'src/shared/constants/tokens';
import { UserQueryPort } from 'src/modules/users/domain/ports/user-query.port';
import { UserCommandPort } from 'src/modules/users/domain/ports/user-command.port';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';


@Injectable()
export class AdminActivateUserUseCase {
  constructor(
    @Inject(USER_QUERY_PORT) 
    private readonly usersQuery: UserQueryPort,
    @Inject(USER_COMMAND_PORT) 
    private readonly usersCmd: UserCommandPort,
  ) {}

  async execute(userId: string) {
    const existing = await this.usersQuery.findById(userId);
    if (!existing) throw new NotFoundDomainException('User not found');
    if (existing.isDeleted) throw new ValidationDomainException('Cannot activate a deleted user');

    return this.usersCmd.updateStatus({ id: userId, isActive: true });
  }
}
