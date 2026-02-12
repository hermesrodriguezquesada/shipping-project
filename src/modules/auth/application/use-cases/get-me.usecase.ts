import { Inject, Injectable } from '@nestjs/common';
import { USER_QUERY_PORT } from 'src/shared/constants/tokens';
import { UnauthorizedDomainException } from 'src/core/exceptions/domain/unauthorized.exception';

import { UserQueryPort } from 'src/modules/users/domain/ports/user-query.port';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_QUERY_PORT)
    private readonly users: UserQueryPort,
  ) {}

  async execute(userId: string): Promise<UserEntity> {
    if (!userId) throw new UnauthorizedDomainException('Not authenticated');

    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedDomainException('Not authenticated');

    if (!user.isActive || user.isDeleted) {
      throw new UnauthorizedDomainException('User is disabled');
    }

    return user;
  }
}
