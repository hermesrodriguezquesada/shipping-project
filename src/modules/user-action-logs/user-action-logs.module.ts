import { Module } from '@nestjs/common';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { USER_ACTION_LOG_COMMAND_PORT, USER_ACTION_LOG_QUERY_PORT } from 'src/shared/constants/tokens';
import { AdminExportUserActionLogsUseCase } from './application/use-cases/admin-export-user-action-logs.usecase';
import { AdminUserActionLogActivityByDayUseCase } from './application/use-cases/admin-user-action-log-activity-by-day.usecase';
import { AdminUserActionLogsUseCase } from './application/use-cases/admin-user-action-logs.usecase';
import { AdminUserActionLogSummaryUseCase } from './application/use-cases/admin-user-action-log-summary.usecase';
import { AdminUserActionLogTopActionsUseCase } from './application/use-cases/admin-user-action-log-top-actions.usecase';
import { AdminUserActionLogTopActorsUseCase } from './application/use-cases/admin-user-action-log-top-actors.usecase';
import { MyUserActionLogsUseCase } from './application/use-cases/my-user-action-logs.usecase';
import { RecordUserActionLogUseCase } from './application/use-cases/record-user-action-log.usecase';
import { PrismaUserActionLogCommandAdapter } from './infrastructure/adapters/prisma-user-action-log-command.adapter';
import { PrismaUserActionLogQueryAdapter } from './infrastructure/adapters/prisma-user-action-log-query.adapter';
import { UserActionLogsResolver } from './presentation/graphql/resolvers/user-action-logs.resolver';

@Module({
  providers: [
    RolesGuard,
    PrismaUserActionLogCommandAdapter,
    PrismaUserActionLogQueryAdapter,
    { provide: USER_ACTION_LOG_COMMAND_PORT, useExisting: PrismaUserActionLogCommandAdapter },
    { provide: USER_ACTION_LOG_QUERY_PORT, useExisting: PrismaUserActionLogQueryAdapter },
    RecordUserActionLogUseCase,
    MyUserActionLogsUseCase,
    AdminUserActionLogsUseCase,
    AdminUserActionLogSummaryUseCase,
    AdminUserActionLogActivityByDayUseCase,
    AdminUserActionLogTopActorsUseCase,
    AdminUserActionLogTopActionsUseCase,
    AdminExportUserActionLogsUseCase,
    UserActionLogsResolver,
  ],
  exports: [USER_ACTION_LOG_COMMAND_PORT, USER_ACTION_LOG_QUERY_PORT, RecordUserActionLogUseCase],
})
export class UserActionLogsModule {}