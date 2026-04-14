import { InternalNotificationEntity } from '../entities/internal-notification.entity';

export interface InternalNotificationQueryPort {
  listByUser(input: {
    userId: string;
    offset: number;
    limit: number;
    isRead?: boolean;
  }): Promise<InternalNotificationEntity[]>;
}
