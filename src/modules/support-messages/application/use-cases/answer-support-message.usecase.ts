import { Inject, Injectable } from '@nestjs/common';
import { SupportMessageStatus } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  SUPPORT_MESSAGE_COMMAND_PORT,
  SUPPORT_MESSAGE_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { SupportMessageEntity } from '../../domain/entities/support-message.entity';
import { SupportMessageCommandPort } from '../../domain/ports/support-message-command.port';
import { SupportMessageQueryPort } from '../../domain/ports/support-message-query.port';

@Injectable()
export class AnswerSupportMessageUseCase {
  constructor(
    @Inject(SUPPORT_MESSAGE_QUERY_PORT)
    private readonly queryPort: SupportMessageQueryPort,
    @Inject(SUPPORT_MESSAGE_COMMAND_PORT)
    private readonly commandPort: SupportMessageCommandPort,
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

    return this.commandPort.answer({
      id: input.id,
      answer,
      answeredById: input.answeredById,
      answeredAt: new Date(),
    });
  }
}
