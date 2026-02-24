import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';

import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';

import { UserType } from '../types/user.type';
import { UserMapper } from '../../mappers/user.mapper';

import { AdminSetUserRolesInput } from '../inputs/admin-set-user-roles.input';
import { AdminSetUserRolesUseCase } from 'src/modules/users/application/use-cases/admin/admin-set-user-roles.usecase';


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

@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Resolver(() => UserType)
export class AdminUsersResolver {
  constructor(
    private readonly listUsers: AdminListUsersUseCase,
    private readonly createUser: AdminCreateUserUseCase,
    private readonly setRoles: AdminSetUserRolesUseCase,
    private readonly banUser: AdminBanUserUseCase,
    private readonly activateUser: AdminActivateUserUseCase,
    private readonly deleteUser: AdminSoftDeleteUserUseCase,
    private readonly updateUserProfile: AdminUpdateUserProfileUseCase,
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
    });
    return UserMapper.toGraphQL(updated);
  }
}
