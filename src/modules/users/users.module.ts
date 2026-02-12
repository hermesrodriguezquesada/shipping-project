import { Module } from '@nestjs/common';
import { USER_AUTH_PORT, USER_COMMAND_PORT, USER_QUERY_PORT } from 'src/shared/constants/tokens';

import { UsersResolver } from './presentation/graphql/resolvers/users.resolver';
import { AdminUsersResolver } from './presentation/graphql/resolvers/admin-users.resolver';

import { GetUserByIdUseCase } from './application/use-cases/get-user-by-id.usecase';
import { AdminListUsersUseCase } from './application/use-cases/admin/admin-list-users.usecase';
import { AdminSetUserRolesUseCase } from './application/use-cases/admin/admin-set-user-roles.usecase';
import { AdminBanUserUseCase } from './application/use-cases/admin/admin-ban-user.usecase';
import { AdminActivateUserUseCase } from './application/use-cases/admin/admin-activate-user.usecase';
import { AdminSoftDeleteUserUseCase } from './application/use-cases/admin/admin-delete-user.usecase';

import { PrismaUserAuthAdapter } from './infrastructure/adapters/prisma-user-auth.adapter';
import { PrismaUserQueryAdapter } from './infrastructure/adapters/prisma-user-query.adapter';
import { PrismaUserCommandAdapter } from './infrastructure/adapters/prisma-user-command.adapter';

import { RolesGuard } from 'src/core/auth/roles.guard';
import { AdminCreateUserUseCase } from './application/use-cases/admin/admin-create-user.usecase';
import { UpdateMyProfileUseCase } from './application/use-cases/update-my-profile.usecase';

@Module({
  providers: [
    RolesGuard,

    PrismaUserAuthAdapter,
    PrismaUserQueryAdapter,
    PrismaUserCommandAdapter,

    { provide: USER_AUTH_PORT, useExisting: PrismaUserAuthAdapter },
    { provide: USER_QUERY_PORT, useExisting: PrismaUserQueryAdapter },
    { provide: USER_COMMAND_PORT, useExisting: PrismaUserCommandAdapter },

    UsersResolver,
    AdminUsersResolver,

    GetUserByIdUseCase,
    AdminListUsersUseCase,
    AdminCreateUserUseCase,
    AdminSetUserRolesUseCase,
    AdminBanUserUseCase,
    AdminActivateUserUseCase,
    AdminSoftDeleteUserUseCase,
    UpdateMyProfileUseCase
  ],
  exports: [USER_AUTH_PORT, USER_QUERY_PORT, USER_COMMAND_PORT],
})
export class UsersModule {}
