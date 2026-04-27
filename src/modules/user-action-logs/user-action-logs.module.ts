import { Module } from '@nestjs/common';
import { RolesGuard } from 'src/core/auth/roles.guard';
import {
  USER_ACTION_ALERT_COMMAND_PORT,
  USER_ACTION_ALERT_QUERY_PORT,
  USER_ACTION_LOG_COMMAND_PORT,
  USER_ACTION_LOG_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { AdminExportUserActionLogsUseCase } from './application/use-cases/admin-export-user-action-logs.usecase';
import { AdminUserActionAlertsUseCase } from './application/use-cases/admin-user-action-alerts.usecase';
import { AdminUserActionLogActivityByDayUseCase } from './application/use-cases/admin-user-action-log-activity-by-day.usecase';
import { AdminUserActionLogDashboardUseCase } from './application/use-cases/admin-user-action-log-dashboard.usecase';
import { AdminUserActionLogsUseCase } from './application/use-cases/admin-user-action-logs.usecase';
import { AdminUserActionLogSummaryUseCase } from './application/use-cases/admin-user-action-log-summary.usecase';
import { AdminUserActionLogTopActionsUseCase } from './application/use-cases/admin-user-action-log-top-actions.usecase';
import { AdminUserActionLogTopActorsUseCase } from './application/use-cases/admin-user-action-log-top-actors.usecase';
import { DetectUserActionAlertUseCase } from './application/use-cases/detect-user-action-alert.usecase';
import { MyUserActionLogsUseCase } from './application/use-cases/my-user-action-logs.usecase';
import { RecordUserActionLogUseCase } from './application/use-cases/record-user-action-log.usecase';
import { PrismaUserActionAlertCommandAdapter } from './infrastructure/adapters/prisma-user-action-alert-command.adapter';
import { PrismaUserActionAlertQueryAdapter } from './infrastructure/adapters/prisma-user-action-alert-query.adapter';
import { PrismaUserActionLogCommandAdapter } from './infrastructure/adapters/prisma-user-action-log-command.adapter';
import { PrismaUserActionLogQueryAdapter } from './infrastructure/adapters/prisma-user-action-log-query.adapter';
import { UserActionLogsResolver } from './presentation/graphql/resolvers/user-action-logs.resolver';

@Module({
  providers: [
    RolesGuard,
    PrismaUserActionAlertCommandAdapter,
    PrismaUserActionAlertQueryAdapter,
    PrismaUserActionLogCommandAdapter,
    PrismaUserActionLogQueryAdapter,
    { provide: USER_ACTION_ALERT_COMMAND_PORT, useExisting: PrismaUserActionAlertCommandAdapter },
    { provide: USER_ACTION_ALERT_QUERY_PORT, useExisting: PrismaUserActionAlertQueryAdapter },
    { provide: USER_ACTION_LOG_COMMAND_PORT, useExisting: PrismaUserActionLogCommandAdapter },
    { provide: USER_ACTION_LOG_QUERY_PORT, useExisting: PrismaUserActionLogQueryAdapter },
    DetectUserActionAlertUseCase,
    RecordUserActionLogUseCase,
    MyUserActionLogsUseCase,
    AdminUserActionLogsUseCase,
    AdminUserActionAlertsUseCase,
    AdminUserActionLogSummaryUseCase,
    AdminUserActionLogActivityByDayUseCase,
    AdminUserActionLogDashboardUseCase,
    AdminUserActionLogTopActorsUseCase,
    AdminUserActionLogTopActionsUseCase,
    AdminExportUserActionLogsUseCase,
    UserActionLogsResolver,
  ],
  exports: [USER_ACTION_LOG_COMMAND_PORT, USER_ACTION_LOG_QUERY_PORT, RecordUserActionLogUseCase],
})
export class UserActionLogsModule {}