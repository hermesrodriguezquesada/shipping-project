import { Inject, Injectable } from '@nestjs/common';
import { SupportMessageStatus } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { SUPPORT_MESSAGE_COMMAND_PORT } from 'src/shared/constants/tokens';
import { SupportMessageEntity } from '../../domain/entities/support-message.entity';
import { SupportMessageCommandPort } from '../../domain/ports/support-message-command.port';

@Injectable()
export class CreateSupportMessageUseCase {
  constructor(
    @Inject(SUPPORT_MESSAGE_COMMAND_PORT)
    private readonly commandPort: SupportMessageCommandPort,
  ) {}

  async execute(input: {
    authorId: string;
    title: string;
    content: string;
  }): Promise<SupportMessageEntity> {
    const title = input.title.trim();
    const content = input.content.trim();

    if (!title) {
      throw new ValidationDomainException('title is required');
    }

    if (!content) {
      throw new ValidationDomainException('content is required');
    }

    const created = await this.commandPort.create({
      authorId: input.authorId,
      title,
      content,
    });

    if (created.status !== SupportMessageStatus.OPEN) {
      throw new ValidationDomainException('support message must be created with OPEN status');
    }

    return created;
  }
}
