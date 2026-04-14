import { InternalNotificationType } from '@prisma/client';

export interface InternalNotificationCommandPort {
  create(input: {
    userId: string;
    type: InternalNotificationType;
    referenceId?: string | null;
  }): Promise<void>;
  markAsRead(input: { id: string; userId: string }): Promise<boolean>;
}
