import { Inject, Injectable, Logger } from '@nestjs/common';
import { InternalNotificationType, Role, SupportMessageStatus } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  INTERNAL_NOTIFICATION_COMMAND_PORT,
  SUPPORT_MESSAGE_COMMAND_PORT,
  USER_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { SupportMessageEntity } from '../../domain/entities/support-message.entity';
import { SupportMessageCommandPort } from '../../domain/ports/support-message-command.port';
import { InternalNotificationCommandPort } from 'src/modules/internal-notifications/domain/ports/internal-notification-command.port';
import { UserQueryPort } from 'src/modules/users/domain/ports/user-query.port';

@Injectable()
export class CreateSupportMessageUseCase {
  private readonly logger = new Logger(CreateSupportMessageUseCase.name);

  constructor(
    @Inject(SUPPORT_MESSAGE_COMMAND_PORT)
    private readonly commandPort: SupportMessageCommandPort,
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly internalNotificationCommand: InternalNotificationCommandPort,
    @Inject(USER_QUERY_PORT)
    private readonly userQuery: UserQueryPort,
  ) {}

  async execute(input: {
    authorId?: string | null;
    email?: string | null;
    phone?: string | null;
    title: string;
    content: string;
  }): Promise<SupportMessageEntity> {
    const title = input.title.trim();
    const content = input.content.trim();
    const authorId = input.authorId ?? null;
    const email = input.email?.trim() || null;
    const phone = input.phone?.trim() || null;

    if (!title) {
      throw new ValidationDomainException('title is required');
    }

    if (!content) {
      throw new ValidationDomainException('content is required');
    }

    if (email !== null && !this.isValidEmail(email)) {
      throw new ValidationDomainException('email must be a valid email');
    }

    if (phone !== null && !this.isValidPhone(phone)) {
      throw new ValidationDomainException('phone must be a valid phone');
    }

    if (authorId === null && email === null && phone === null) {
      throw new ValidationDomainException('email or phone is required when author is anonymous');
    }

    const created = await this.commandPort.create({
      authorId,
      email,
      phone,
      title,
      content,
    });

    if (created.status !== SupportMessageStatus.OPEN) {
      throw new ValidationDomainException('support message must be created with OPEN status');
    }

    await this.notifyAdminsSafe(InternalNotificationType.NEW_SUPPORT_MESSAGE, created.id);

    return created;
  }

  private async notifyAdminsSafe(type: InternalNotificationType, referenceId: string): Promise<void> {
    try {
      const admins = await this.userQuery.findMany(
        { role: Role.ADMIN, isDeleted: false },
        { limit: 200 },
      );
      await Promise.all(
        admins.map((admin) =>
          this.internalNotificationCommand.create({ userId: admin.id, type, referenceId }),
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Non-blocking admin notification failure. type=${type} referenceId=${referenceId} error=${message}`,
      );
    }
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private isValidPhone(value: string): boolean {
    return value.length >= 3;
  }
}
