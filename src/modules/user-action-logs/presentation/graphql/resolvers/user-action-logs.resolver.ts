import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { AdminExportUserActionLogsUseCase } from '../../../application/use-cases/admin-export-user-action-logs.usecase';
import { AdminUserActionLogActivityByDayUseCase } from '../../../application/use-cases/admin-user-action-log-activity-by-day.usecase';
import { AdminUserActionLogsUseCase } from '../../../application/use-cases/admin-user-action-logs.usecase';
import { AdminUserActionLogSummaryUseCase } from '../../../application/use-cases/admin-user-action-log-summary.usecase';
import { AdminUserActionLogTopActionsUseCase } from '../../../application/use-cases/admin-user-action-log-top-actions.usecase';
import { AdminUserActionLogTopActorsUseCase } from '../../../application/use-cases/admin-user-action-log-top-actors.usecase';
import { MyUserActionLogsUseCase } from '../../../application/use-cases/my-user-action-logs.usecase';
import { AdminExportUserActionLogsInput } from '../inputs/admin-export-user-action-logs.input';
import { UserActionLogMapper } from '../mappers/user-action-log.mapper';
import { AdminUserActionLogListInput } from '../inputs/admin-user-action-log-list.input';
import { AdminUserActionLogReportInput } from '../inputs/admin-user-action-log-report.input';
import { AdminUserActionLogTopInput } from '../inputs/admin-user-action-log-top.input';
import { UserActionLogListInput } from '../inputs/user-action-log-list.input';
import { UserActionLogActivityBucketType } from '../types/user-action-log-activity-bucket.type';
import { UserActionLogExportPayloadType } from '../types/user-action-log-export-payload.type';
import { UserActionLogSummaryType } from '../types/user-action-log-summary.type';
import { UserActionLogTopActionType } from '../types/user-action-log-top-action.type';
import { UserActionLogTopActorType } from '../types/user-action-log-top-actor.type';
import { UserActionLogType } from '../types/user-action-log.type';

@Resolver(() => UserActionLogType)
export class UserActionLogsResolver {
  constructor(
    private readonly myUserActionLogsUseCase: MyUserActionLogsUseCase,
    private readonly adminUserActionLogsUseCase: AdminUserActionLogsUseCase,
    private readonly adminUserActionLogSummaryUseCase: AdminUserActionLogSummaryUseCase,
    private readonly adminUserActionLogActivityByDayUseCase: AdminUserActionLogActivityByDayUseCase,
    private readonly adminUserActionLogTopActorsUseCase: AdminUserActionLogTopActorsUseCase,
    private readonly adminUserActionLogTopActionsUseCase: AdminUserActionLogTopActionsUseCase,
    private readonly adminExportUserActionLogsUseCase: AdminExportUserActionLogsUseCase,
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

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => UserActionLogSummaryType)
  async adminUserActionLogSummary(
    @Args('input', { type: () => AdminUserActionLogReportInput }) input: AdminUserActionLogReportInput,
  ): Promise<UserActionLogSummaryType> {
    return this.adminUserActionLogSummaryUseCase.execute(input);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => [UserActionLogActivityBucketType])
  async adminUserActionLogActivityByDay(
    @Args('input', { type: () => AdminUserActionLogReportInput }) input: AdminUserActionLogReportInput,
  ): Promise<UserActionLogActivityBucketType[]> {
    return this.adminUserActionLogActivityByDayUseCase.execute(input);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => [UserActionLogTopActorType])
  async adminUserActionLogTopActors(
    @Args('input', { type: () => AdminUserActionLogTopInput }) input: AdminUserActionLogTopInput,
  ): Promise<UserActionLogTopActorType[]> {
    return this.adminUserActionLogTopActorsUseCase.execute(input);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => [UserActionLogTopActionType])
  async adminUserActionLogTopActions(
    @Args('input', { type: () => AdminUserActionLogReportInput }) input: AdminUserActionLogReportInput,
  ): Promise<UserActionLogTopActionType[]> {
    return this.adminUserActionLogTopActionsUseCase.execute(input);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => UserActionLogExportPayloadType)
  async adminExportUserActionLogs(
    @Args('input', { type: () => AdminExportUserActionLogsInput }) input: AdminExportUserActionLogsInput,
  ): Promise<UserActionLogExportPayloadType> {
    return this.adminExportUserActionLogsUseCase.execute(input);
  }
}