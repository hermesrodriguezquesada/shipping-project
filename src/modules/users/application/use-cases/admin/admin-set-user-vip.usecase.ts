import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { USER_COMMAND_PORT, USER_QUERY_PORT } from 'src/shared/constants/tokens';
import { UserCommandPort } from 'src/modules/users/domain/ports/user-command.port';
import { UserQueryPort } from 'src/modules/users/domain/ports/user-query.port';

@Injectable()
export class AdminSetUserVipUseCase {
  constructor(
    @Inject(USER_QUERY_PORT)
    private readonly usersQuery: UserQueryPort,
    @Inject(USER_COMMAND_PORT)
    private readonly usersCmd: UserCommandPort,
  ) {}

  async execute(input: { userId: string; isVip: boolean }) {
    const existing = await this.usersQuery.findById(input.userId);
    if (!existing) throw new NotFoundDomainException('User not found');

    return this.usersCmd.updateProfile({ id: input.userId, isVip: input.isVip });
  }
}
