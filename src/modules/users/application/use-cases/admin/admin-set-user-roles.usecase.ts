import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { USER_COMMAND_PORT, USER_QUERY_PORT } from 'src/shared/constants/tokens';

import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { UserQueryPort } from 'src/modules/users/domain/ports/user-query.port';
import { UserCommandPort } from 'src/modules/users/domain/ports/user-command.port';
import { normalizeRoles } from 'src/shared/utils/normaliceRoles';

@Injectable()
export class AdminSetUserRolesUseCase {
  constructor(
    @Inject(USER_QUERY_PORT) 
    private readonly usersQuery: UserQueryPort,
    @Inject(USER_COMMAND_PORT) 
    private readonly usersCmd: UserCommandPort,
  ) {}

  async execute(input: { userId: string; roles: Role[] }) {
    if (!input.roles?.length) throw new ValidationDomainException('Roles are required');

    const existing = await this.usersQuery.findById(input.userId);
    if (!existing) throw new NotFoundDomainException('User not found');

    return this.usersCmd.updateRoles({ id: input.userId, roles: normalizeRoles(input.roles)});
  }
}
