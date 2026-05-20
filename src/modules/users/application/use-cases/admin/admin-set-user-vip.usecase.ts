import { Inject, Injectable, Logger } from '@nestjs/common';
import { InternalNotificationType } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import {
  INTERNAL_NOTIFICATION_COMMAND_PORT,
  USER_COMMAND_PORT,
  USER_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { UserCommandPort } from 'src/modules/users/domain/ports/user-command.port';
import { UserQueryPort } from 'src/modules/users/domain/ports/user-query.port';
import { InternalNotificationCommandPort } from 'src/modules/internal-notifications/domain/ports/internal-notification-command.port';

@Injectable()
export class AdminSetUserVipUseCase {
  private readonly logger = new Logger(AdminSetUserVipUseCase.name);

  constructor(
    @Inject(USER_QUERY_PORT)
    private readonly usersQuery: UserQueryPort,
    @Inject(USER_COMMAND_PORT)
    private readonly usersCmd: UserCommandPort,
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly notificationCmd: InternalNotificationCommandPort,
  ) {}

  async execute(input: { userId: string; isVip: boolean }) {
    const existing = await this.usersQuery.findById(input.userId);
    if (!existing) throw new NotFoundDomainException('User not found');

    const updated = await this.usersCmd.updateProfile({ id: input.userId, isVip: input.isVip });

    // Only notify when the VIP status actually changes to avoid duplicate notifications
    if (existing.isVip !== input.isVip) {
      await this.notifyUserSafe(input.userId, input.isVip);
    }

    return updated;
  }

  private async notifyUserSafe(userId: string, isVip: boolean): Promise<void> {
    const type = isVip
      ? InternalNotificationType.SET_USER_VIP
      : InternalNotificationType.UNSET_USER_VIP;
    try {
      await this.notificationCmd.create({ userId, type, referenceId: userId });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Non-blocking VIP notification failure. type=${type} userId=${userId} error=${message}`,
      );
    }
  }
}

