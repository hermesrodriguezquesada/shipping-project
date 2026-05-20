import { Inject, Injectable } from '@nestjs/common';
import { INTERNAL_NOTIFICATION_COMMAND_PORT } from 'src/shared/constants/tokens';
import { InternalNotificationCommandPort } from '../../domain/ports/internal-notification-command.port';

@Injectable()
export class MarkAllNotificationsAsReadUseCase {
  constructor(
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly commandPort: InternalNotificationCommandPort,
  ) {}

  async execute(input: { userId: string }): Promise<boolean> {
    return this.commandPort.markAllAsRead({ userId: input.userId });
  }
}
