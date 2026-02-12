import { Inject, Injectable } from '@nestjs/common';
import { USER_QUERY_PORT } from 'src/shared/constants/tokens';
import { UserQueryPort } from '../../domain/ports/user-query.port';
import { UserEntity } from '../../domain/entities/user.entity';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(USER_QUERY_PORT)
    private readonly usersQuery: UserQueryPort,
  ) {}

  async execute(id: string): Promise<UserEntity> {
    const user = await this.usersQuery.findById(id);
    if (!user) throw new NotFoundDomainException(`User with id ${id} not found`);
    return user;
  }
}
