import { Inject, Injectable } from '@nestjs/common';
import { INTERNAL_NOTIFICATION_QUERY_PORT } from 'src/shared/constants/tokens';
import { InternalNotificationEntity } from '../../domain/entities/internal-notification.entity';
import { InternalNotificationQueryPort } from '../../domain/ports/internal-notification-query.port';

@Injectable()
export class ListMyNotificationsUseCase {
  constructor(
    @Inject(INTERNAL_NOTIFICATION_QUERY_PORT)
    private readonly queryPort: InternalNotificationQueryPort,
  ) {}

  async execute(input: {
    userId: string;
    offset?: number;
    limit?: number;
    isRead?: boolean;
  }): Promise<InternalNotificationEntity[]> {
    return this.queryPort.listByUser({
      userId: input.userId,
      offset: input.offset ?? 0,
      limit: input.limit ?? 50,
      isRead: input.isRead,
    });
  }
}
