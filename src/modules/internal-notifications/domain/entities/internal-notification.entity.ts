import { InternalNotificationType } from '@prisma/client';

export interface InternalNotificationEntity {
  id: string;
  type: InternalNotificationType;
  referenceId: string | null;
  userId: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
