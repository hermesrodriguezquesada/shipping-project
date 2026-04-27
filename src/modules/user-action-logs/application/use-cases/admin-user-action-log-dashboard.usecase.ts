import { Inject, Injectable } from '@nestjs/common';
import { UserActionLogAction } from '@prisma/client';
import { USER_ACTION_LOG_QUERY_PORT } from 'src/shared/constants/tokens';
import {
  UserActionLogDashboard,
  UserActionLogQueryPort,
} from '../../domain/ports/user-action-log-query.port';
import { AdminUserActionLogActivityByDayUseCase } from './admin-user-action-log-activity-by-day.usecase';
import { AdminUserActionLogSummaryUseCase } from './admin-user-action-log-summary.usecase';
import { AdminUserActionLogTopActionsUseCase } from './admin-user-action-log-top-actions.usecase';
import { AdminUserActionLogTopActorsUseCase } from './admin-user-action-log-top-actors.usecase';
import { assertValidAdminUserActionLogDateRange } from '../utils/admin-user-action-log-report-validation';

const DASHBOARD_TOP_ACTORS_LIMIT = 10;
const DASHBOARD_RECENT_CRITICAL_ACTIONS_LIMIT = 20;
const DASHBOARD_CRITICAL_ACTIONS: UserActionLogAction[] = [
  UserActionLogAction.LOGIN,
  UserActionLogAction.ADMIN_UPDATE_USER,
  UserActionLogAction.ADMIN_SET_USER_VIP,
  UserActionLogAction.ADMIN_CONFIRM_REMITTANCE_PAYMENT,
  UserActionLogAction.ADMIN_MARK_REMITTANCE_DELIVERED,
  UserActionLogAction.CANCEL_REMITTANCE,
  UserActionLogAction.CREATE_VIP_PAYMENT_PROOF,
  UserActionLogAction.ADMIN_CONFIRM_VIP_PAYMENT_PROOF,
  UserActionLogAction.ADMIN_CANCEL_VIP_PAYMENT_PROOF,
];

type AdminUserActionLogDashboardInput = {
  dateFrom: Date;
  dateTo: Date;
  actorUserId?: string;
  action?: UserActionLogAction;
  resourceType?: string;
  resourceId?: string;
};

@Injectable()
export class AdminUserActionLogDashboardUseCase {
  constructor(
    private readonly adminUserActionLogSummaryUseCase: AdminUserActionLogSummaryUseCase,
    private readonly adminUserActionLogActivityByDayUseCase: AdminUserActionLogActivityByDayUseCase,
    private readonly adminUserActionLogTopActorsUseCase: AdminUserActionLogTopActorsUseCase,
    private readonly adminUserActionLogTopActionsUseCase: AdminUserActionLogTopActionsUseCase,
    @Inject(USER_ACTION_LOG_QUERY_PORT)
    private readonly queryPort: UserActionLogQueryPort,
  ) {}

  async execute(input: AdminUserActionLogDashboardInput): Promise<UserActionLogDashboard> {
    assertValidAdminUserActionLogDateRange(input);

    const criticalActions = input.action
      ? DASHBOARD_CRITICAL_ACTIONS.includes(input.action)
        ? [input.action]
        : []
      : DASHBOARD_CRITICAL_ACTIONS;

    const [summary, activityByDay, topActors, topActions, recentCriticalActions] = await Promise.all([
      this.adminUserActionLogSummaryUseCase.execute(input),
      this.adminUserActionLogActivityByDayUseCase.execute(input),
      this.adminUserActionLogTopActorsUseCase.execute({ ...input, limit: DASHBOARD_TOP_ACTORS_LIMIT }),
      this.adminUserActionLogTopActionsUseCase.execute(input),
      criticalActions.length > 0
        ? this.queryPort.listAdminRecentByActions(input, criticalActions, DASHBOARD_RECENT_CRITICAL_ACTIONS_LIMIT)
        : Promise.resolve([]),
    ]);

    return {
      summary,
      activityByDay,
      topActors,
      topActions,
      recentCriticalActions,
    };
  }
}