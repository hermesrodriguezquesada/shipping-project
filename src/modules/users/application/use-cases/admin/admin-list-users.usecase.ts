import { Inject, Injectable } from '@nestjs/common';
import { USER_QUERY_PORT } from 'src/shared/constants/tokens';
import { UserQueryPort } from 'src/modules/users/domain/ports/user-query.port';
import { AdminListUsersInputDto } from '../../dto/admin-list-users.input.dto';

@Injectable()
export class AdminListUsersUseCase {
  constructor(
    @Inject(USER_QUERY_PORT)
    private readonly users: UserQueryPort,
  ) {}

  async execute(input: AdminListUsersInputDto) {
    return this.users.findMany(
      {
        id: input.id,
        email: input.email,
        role: input.role,
        isActive: input.isActive,
        isDeleted: input.isDeleted,
      },
      { offset: input.offset ?? 0, limit: input.limit ?? 50 },
    );
  }
}
