import { Inject, Injectable } from '@nestjs/common';
import { UserActionAlertType } from '@prisma/client';
import { USER_ACTION_ALERT_QUERY_PORT } from 'src/shared/constants/tokens';
import { UserActionAlertEntity } from '../../domain/entities/user-action-alert.entity';
import { UserActionAlertQueryPort } from '../../domain/ports/user-action-alert-query.port';

@Injectable()
export class AdminUserActionAlertsUseCase {
  constructor(
    @Inject(USER_ACTION_ALERT_QUERY_PORT)
    private readonly queryPort: UserActionAlertQueryPort,
  ) {}

  async execute(input: {
    type?: UserActionAlertType;
    actorUserId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    offset?: number;
    limit?: number;
  }): Promise<UserActionAlertEntity[]> {
    return this.queryPort.listAdmin(
      {
        type: input.type,
        actorUserId: input.actorUserId,
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