import { Logger, UseGuards } from '@nestjs/common';
import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role, UserActionLogAction } from '@prisma/client';
import { Request } from 'express';

import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';

import { UserType } from '../types/user.type';
import { UserMapper } from '../../mappers/user.mapper';

import { AdminSetUserRolesInput } from '../inputs/admin-set-user-roles.input';
import { AdminSetUserRolesUseCase } from 'src/modules/users/application/use-cases/admin/admin-set-user-roles.usecase';
import { AdminSetUserVipInput } from '../inputs/admin-set-user-vip.input';
import { AdminSetUserVipUseCase } from 'src/modules/users/application/use-cases/admin/admin-set-user-vip.usecase';


import { AdminListUsersInputDto } from 'src/modules/users/application/dto/admin-list-users.input.dto';
import { AdminListUsersUseCase } from 'src/modules/users/application/use-cases/admin/admin-list-users.usecase';

import { AdminBanUserUseCase } from 'src/modules/users/application/use-cases/admin/admin-ban-user.usecase';
import { AdminActivateUserUseCase } from 'src/modules/users/application/use-cases/admin/admin-activate-user.usecase';
import { AdminSoftDeleteUserUseCase } from 'src/modules/users/application/use-cases/admin/admin-delete-user.usecase';

import { AdminCreateUserInput } from '../inputs/admin-create-user.input';
import { AdminCreateUserUseCase } from 'src/modules/users/application/use-cases/admin/admin-create-user.usecase';
import { AdminListUsersInput } from '../inputs/admin-list-users.input';
import { AdminUpdateUserProfileInput } from '../inputs/admin-update-user-profile.input';
import { AdminUpdateUserProfileUseCase } from 'src/modules/users/application/use-cases/admin/admin-update-user-profile.usecase';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { RecordUserActionLogUseCase } from 'src/modules/user-action-logs/application/use-cases/record-user-action-log.usecase';
import { recordUserActionLogSafe } from 'src/modules/user-action-logs/application/utils/record-user-action-log-safe';
import { getPrimaryRole, getRequestAuditContext } from 'src/modules/user-action-logs/application/utils/user-action-log-context';

@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Resolver(() => UserType)
export class AdminUsersResolver {
  private readonly logger = new Logger(AdminUsersResolver.name);

  constructor(
    private readonly listUsers: AdminListUsersUseCase,
    private readonly createUser: AdminCreateUserUseCase,
    private readonly setRoles: AdminSetUserRolesUseCase,
    private readonly setUserVip: AdminSetUserVipUseCase,
    private readonly banUser: AdminBanUserUseCase,
    private readonly activateUser: AdminActivateUserUseCase,
    private readonly deleteUser: AdminSoftDeleteUserUseCase,
    private readonly updateUserProfile: AdminUpdateUserProfileUseCase,
    private readonly recordUserActionLogUseCase: RecordUserActionLogUseCase,
  ) {}

@Query(() => [UserType], { name: 'adminUsers' })
async adminUsers(
  @Args('input', { type: () => AdminListUsersInput, nullable: true })
  input?: AdminListUsersInput,
): Promise<UserType[]> {
  const dto: AdminListUsersInputDto = {
    id: input?.id,
    email: input?.email,
    role: input?.role,
    isActive: input?.isActive,
    isDeleted: input?.isDeleted,
    offset: input?.offset,
    limit: input?.limit,
  };

  const users = await this.listUsers.execute(dto);
  return users.map(UserMapper.toGraphQL);
}


  @Mutation(() => UserType, { name: 'adminCreateUser' })
  async adminCreateUserMutation(
    @Args('input') input: AdminCreateUserInput,
  ): Promise<UserType> {
    const created = await this.createUser.execute({
      email: input.email,
      password: input.password,
      role: input.role,
      roles: input.roles,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      birthDate: input.birthDate,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      country: input.country,
      postalCode: input.postalCode,
      isVip: input.isVip,
      clientType: input.clientType,
      companyName: input.companyName,
    });
    return UserMapper.toGraphQL(created);
  }

  @Mutation(() => UserType, { name: 'adminSetUserRoles' })
  async adminSetUserRoles(
    @Args('input') input: AdminSetUserRolesInput,
  ): Promise<UserType> {
    const updated = await this.setRoles.execute({
      userId: input.userId,
      roles: input.roles,
    });
    return UserMapper.toGraphQL(updated);
  }

  @Mutation(() => UserType, { name: 'adminSetUserVip' })
  async adminSetUserVip(
    @Args('input') input: AdminSetUserVipInput,
    @CurrentUser() authUser: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<UserType> {
    const updated = await this.setUserVip.execute({
      userId: input.userId,
      isVip: input.isVip,
    });

    await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
      actorUserId: authUser.id,
      actorEmail: authUser.email,
      actorRole: getPrimaryRole(authUser.roles),
      action: UserActionLogAction.ADMIN_SET_USER_VIP,
      resourceType: 'USER',
      resourceId: input.userId,
      description: 'Admin updated user VIP flag',
      metadata: { isVip: input.isVip },
      ...getRequestAuditContext(req),
    });

    return UserMapper.toGraphQL(updated);
  }

  @Mutation(() => UserType, { name: 'adminBanUser' })
  async adminBanUser(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<UserType> {
    const updated = await this.banUser.execute(userId);
    return UserMapper.toGraphQL(updated);
  }

  @Mutation(() => UserType, { name: 'adminActivateUser' })
  async adminActivateUser(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<UserType> {
    const updated = await this.activateUser.execute(userId);
    return UserMapper.toGraphQL(updated);
  }

  @Mutation(() => UserType, { name: 'adminDeleteUser' })
  async adminDeleteUser(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<UserType> {
    const updated = await this.deleteUser.execute(userId);
    return UserMapper.toGraphQL(updated);
  }

  @Mutation(() => UserType, { name: 'adminUpdateUserProfile' })
  async adminUpdateUserProfile(
    @Args('input') input: AdminUpdateUserProfileInput,
    @CurrentUser() authUser: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<UserType> {
    const updated = await this.updateUserProfile.execute({
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      birthDate: input.birthDate,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      country: input.country,
      postalCode: input.postalCode,
      isVip: input.isVip,
      clientType: input.clientType,
      companyName: input.companyName,
    });

    await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
      actorUserId: authUser.id,
      actorEmail: authUser.email,
      actorRole: getPrimaryRole(authUser.roles),
      action: UserActionLogAction.ADMIN_UPDATE_USER,
      resourceType: 'USER',
      resourceId: input.userId,
      description: 'Admin updated user profile',
      metadata: {
        updatedFields: Object.entries(input)
          .filter(([key, value]) => key !== 'userId' && value !== undefined && value !== null)
          .map(([key]) => key),
      },
      ...getRequestAuditContext(req),
    });

    return UserMapper.toGraphQL(updated);
  }
}
