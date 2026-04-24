import { Inject, Injectable } from '@nestjs/common';
import { UserActionLogAction } from '@prisma/client';
import { USER_ACTION_LOG_QUERY_PORT } from 'src/shared/constants/tokens';
import { UserActionLogQueryPort, UserActionLogTopAction } from '../../domain/ports/user-action-log-query.port';
import { assertValidAdminUserActionLogDateRange } from '../utils/admin-user-action-log-report-validation';

@Injectable()
export class AdminUserActionLogTopActionsUseCase {
  constructor(
    @Inject(USER_ACTION_LOG_QUERY_PORT)
    private readonly queryPort: UserActionLogQueryPort,
  ) {}

  async execute(input: {
    dateFrom: Date;
    dateTo: Date;
    actorUserId?: string;
    action?: UserActionLogAction;
    resourceType?: string;
    resourceId?: string;
  }): Promise<UserActionLogTopAction[]> {
    assertValidAdminUserActionLogDateRange(input);

    return this.queryPort.getAdminTopActions(input);
  }
}