import { Inject, Injectable } from '@nestjs/common';
import { UserActionLogAction } from '@prisma/client';
import { USER_ACTION_LOG_QUERY_PORT } from 'src/shared/constants/tokens';
import { UserActionLogEntity } from '../../domain/entities/user-action-log.entity';
import { UserActionLogQueryPort } from '../../domain/ports/user-action-log-query.port';

@Injectable()
export class MyUserActionLogsUseCase {
  constructor(
    @Inject(USER_ACTION_LOG_QUERY_PORT)
    private readonly queryPort: UserActionLogQueryPort,
  ) {}

  async execute(input: {
    actorUserId: string;
    action?: UserActionLogAction;
    dateFrom?: Date;
    dateTo?: Date;
    offset?: number;
    limit?: number;
  }): Promise<UserActionLogEntity[]> {
    return this.queryPort.listMine(
      input.actorUserId,
      {
        action: input.action,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      },
      {
        offset: input.offset ?? 0,
        limit: input.limit ?? 50,
      },
    );
  }
}