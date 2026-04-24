import { Resolver, Query, Args, ID, Mutation, Context } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserActionLogAction } from '@prisma/client';

import { UserType } from '../types/user.type';
import { GetUserByIdUseCase } from '../../../application/use-cases/get-user-by-id.usecase';
import { UserMapper } from 'src/modules/users/presentation/mappers/user.mapper';
import { UserEntity } from '../../../domain/entities/user.entity';
import { UpdateMyProfileUseCase } from 'src/modules/users/application/use-cases/update-my-profile.usecase';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { UpdateMyProfileInput } from '../inputs/update-my-profile.input';
import { RecordUserActionLogUseCase } from 'src/modules/user-action-logs/application/use-cases/record-user-action-log.usecase';
import { recordUserActionLogSafe } from 'src/modules/user-action-logs/application/utils/record-user-action-log-safe';
import { getPrimaryRole, getRequestAuditContext } from 'src/modules/user-action-logs/application/utils/user-action-log-context';

@Resolver(() => UserType)
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
    private readonly recordUserActionLogUseCase: RecordUserActionLogUseCase,
  ) {}

  @Query(() => UserType, { nullable: true })
  async user(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<UserType | null> {
    const user: UserEntity = await this.getUserByIdUseCase.execute(id);
    return UserMapper.toGraphQL(user);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserType)
  async myProfile(@CurrentUser() authUser: AuthContextUser): Promise<UserType> {
    const user = await this.getUserByIdUseCase.execute(authUser.id);
    return UserMapper.toGraphQL(user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserType)
  async updateMyProfile(
    @CurrentUser() authUser: AuthContextUser,
    @Args('input') input: UpdateMyProfileInput,
    @Context('req') req: Request,
  ): Promise<UserType> {
    const updated = await this.updateMyProfileUseCase.execute(authUser.id, input);

    await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
      actorUserId: updated.id,
      actorEmail: updated.email,
      actorRole: getPrimaryRole(updated.roles),
      action: UserActionLogAction.UPDATE_PROFILE,
      resourceType: 'USER',
      resourceId: updated.id,
      description: 'User updated own profile',
      metadata: {
        updatedFields: Object.entries(input)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key]) => key),
      },
      ...getRequestAuditContext(req),
    });

    return UserMapper.toGraphQL(updated);
  }
}
