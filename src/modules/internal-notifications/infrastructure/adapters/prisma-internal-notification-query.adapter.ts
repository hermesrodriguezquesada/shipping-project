import { Injectable } from '@nestjs/common';
import { InternalNotification as PrismaInternalNotification } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { InternalNotificationEntity } from '../../domain/entities/internal-notification.entity';
import { InternalNotificationQueryPort } from '../../domain/ports/internal-notification-query.port';

@Injectable()
export class PrismaInternalNotificationQueryAdapter implements InternalNotificationQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listByUser(input: {
    userId: string;
    offset: number;
    limit: number;
    isRead?: boolean;
  }): Promise<InternalNotificationEntity[]> {
    const rows = await this.prisma.internalNotification.findMany({
      where: {
        userId: input.userId,
        ...(input.isRead === undefined ? {} : { isRead: input.isRead }),
      },
      skip: input.offset,
      take: input.limit,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(this.toEntity);
  }

  private toEntity(row: PrismaInternalNotification): InternalNotificationEntity {
    return { ...row };
  }
}
