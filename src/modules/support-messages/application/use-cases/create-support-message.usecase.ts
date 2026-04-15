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

    return created;
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private isValidPhone(value: string): boolean {
    return value.length >= 3;
  }
}
