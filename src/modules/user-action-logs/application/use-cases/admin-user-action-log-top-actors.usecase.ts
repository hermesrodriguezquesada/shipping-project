import { Inject, Injectable } from '@nestjs/common';
import { UserActionLogAction } from '@prisma/client';
import { USER_ACTION_LOG_QUERY_PORT } from 'src/shared/constants/tokens';
import { UserActionLogQueryPort, UserActionLogTopActor } from '../../domain/ports/user-action-log-query.port';
import {
  assertValidAdminUserActionLogDateRange,
  resolveAdminUserActionLogTopLimit,
} from '../utils/admin-user-action-log-report-validation';

@Injectable()
export class AdminUserActionLogTopActorsUseCase {
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
    limit?: number;
  }): Promise<UserActionLogTopActor[]> {
    assertValidAdminUserActionLogDateRange(input);
    const limit = resolveAdminUserActionLogTopLimit(input.limit);

    return this.queryPort.getAdminTopActors(input, limit);
  }
}