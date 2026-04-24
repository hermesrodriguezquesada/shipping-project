import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { AdminUserActionLogsUseCase } from '../../../application/use-cases/admin-user-action-logs.usecase';
import { MyUserActionLogsUseCase } from '../../../application/use-cases/my-user-action-logs.usecase';
import { UserActionLogMapper } from '../mappers/user-action-log.mapper';
import { AdminUserActionLogListInput } from '../inputs/admin-user-action-log-list.input';
import { UserActionLogListInput } from '../inputs/user-action-log-list.input';
import { UserActionLogType } from '../types/user-action-log.type';

@Resolver(() => UserActionLogType)
export class UserActionLogsResolver {
  constructor(
    private readonly myUserActionLogsUseCase: MyUserActionLogsUseCase,
    private readonly adminUserActionLogsUseCase: AdminUserActionLogsUseCase,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => [UserActionLogType])
  async myUserActionLogs(
    @CurrentUser() authUser: AuthContextUser,
    @Args('input', { type: () => UserActionLogListInput, nullable: true }) input?: UserActionLogListInput,
  ): Promise<UserActionLogType[]> {
    const rows = await this.myUserActionLogsUseCase.execute({
      actorUserId: authUser.id,
      action: input?.action,
      dateFrom: input?.dateFrom,
      dateTo: input?.dateTo,
      offset: input?.offset,
      limit: input?.limit,
    });

    return rows.map(UserActionLogMapper.toGraphQL);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => [UserActionLogType])
  async adminUserActionLogs(
    @Args('input', { type: () => AdminUserActionLogListInput, nullable: true }) input?: AdminUserActionLogListInput,
  ): Promise<UserActionLogType[]> {
    const rows = await this.adminUserActionLogsUseCase.execute({
      actorUserId: input?.actorUserId,
      action: input?.action,
      resourceType: input?.resourceType,
      resourceId: input?.resourceId,
      dateFrom: input?.dateFrom,
      dateTo: input?.dateTo,
      offset: input?.offset,
      limit: input?.limit,
    });

    return rows.map(UserActionLogMapper.toGraphQL);
  }
}