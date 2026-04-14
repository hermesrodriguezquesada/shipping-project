import { Inject, Injectable } from '@nestjs/common';
import { INTERNAL_NOTIFICATION_COMMAND_PORT } from 'src/shared/constants/tokens';
import { InternalNotificationCommandPort } from '../../domain/ports/internal-notification-command.port';

@Injectable()
export class MarkNotificationAsReadUseCase {
  constructor(
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly commandPort: InternalNotificationCommandPort,
  ) {}

  async execute(input: { id: string; userId: string }): Promise<boolean> {
    return this.commandPort.markAsRead(input);
  }
}
