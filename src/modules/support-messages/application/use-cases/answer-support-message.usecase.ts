import { Inject, Injectable, Logger } from '@nestjs/common';
import { InternalNotificationType, SupportMessageStatus } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  INTERNAL_NOTIFICATION_COMMAND_PORT,
  SUPPORT_MESSAGE_COMMAND_PORT,
  SUPPORT_MESSAGE_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { SupportMessageEntity } from '../../domain/entities/support-message.entity';
import { SupportMessageCommandPort } from '../../domain/ports/support-message-command.port';
import { SupportMessageQueryPort } from '../../domain/ports/support-message-query.port';
import { InternalNotificationCommandPort } from 'src/modules/internal-notifications/domain/ports/internal-notification-command.port';

@Injectable()
export class AnswerSupportMessageUseCase {
  private readonly logger = new Logger(AnswerSupportMessageUseCase.name);

  constructor(
    @Inject(SUPPORT_MESSAGE_QUERY_PORT)
    private readonly queryPort: SupportMessageQueryPort,
    @Inject(SUPPORT_MESSAGE_COMMAND_PORT)
    private readonly commandPort: SupportMessageCommandPort,
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly internalNotificationCommand: InternalNotificationCommandPort,
  ) {}

  async execute(input: {
    id: string;
    answer: string;
    answeredById: string;
  }): Promise<SupportMessageEntity> {
    const existing = await this.queryPort.findById(input.id);
    if (!existing) {
      throw new NotFoundDomainException('Support message not found');
    }

    if (existing.status === SupportMessageStatus.ANSWERED) {
      throw new ValidationDomainException('Support message is already answered');
    }

    const answer = input.answer.trim();
    if (!answer) {
      throw new ValidationDomainException('answer is required');
    }

    const answered = await this.commandPort.answer({
      id: input.id,
      answer,
      answeredById: input.answeredById,
      answeredAt: new Date(),
    });

    await this.notifyAuthorSafe(existing.authorId ?? null, answered.id);

    return answered;
  }

  private async notifyAuthorSafe(authorId: string | null, referenceId: string): Promise<void> {
    // If the message is anonymous (authorId = null), no client notification is created.
    if (!authorId) return;

    try {
      await this.internalNotificationCommand.create({
        userId: authorId,
        type: InternalNotificationType.SUPPORT_MESSAGE_ANSWERED,
        referenceId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Non-blocking notification failure for SUPPORT_MESSAGE_ANSWERED. authorId=${authorId} referenceId=${referenceId} error=${message}`,
      );
    }
  }
}
