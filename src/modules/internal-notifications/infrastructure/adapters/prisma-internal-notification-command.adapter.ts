import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { InternalNotificationCommandPort } from '../../domain/ports/internal-notification-command.port';

@Injectable()
export class PrismaInternalNotificationCommandAdapter implements InternalNotificationCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    userId: string;
    type: import('@prisma/client').InternalNotificationType;
    referenceId?: string | null;
  }): Promise<void> {
    await this.prisma.internalNotification.create({
      data: {
        userId: input.userId,
        type: input.type,
        referenceId: input.referenceId ?? null,
      },
    });
  }

  async markAsRead(input: { id: string; userId: string }): Promise<boolean> {
    const updated = await this.prisma.internalNotification.updateMany({
      where: { id: input.id, userId: input.userId, isRead: false },
      data: { isRead: true },
    });

    return updated.count > 0;
  }
}
