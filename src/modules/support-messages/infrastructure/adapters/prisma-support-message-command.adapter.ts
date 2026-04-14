import { Injectable } from '@nestjs/common';
import {
  SupportMessage as PrismaSupportMessage,
  SupportMessageStatus,
} from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { SupportMessageEntity } from '../../domain/entities/support-message.entity';
import { SupportMessageCommandPort } from '../../domain/ports/support-message-command.port';

@Injectable()
export class PrismaSupportMessageCommandAdapter implements SupportMessageCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    authorId: string;
    title: string;
    content: string;
  }): Promise<SupportMessageEntity> {
    const row = await this.prisma.supportMessage.create({
      data: {
        authorId: input.authorId,
        title: input.title,
        content: input.content,
        status: SupportMessageStatus.OPEN,
      },
    });

    return this.toEntity(row);
  }

  async answer(input: {
    id: string;
    answer: string;
    answeredById: string;
    answeredAt: Date;
  }): Promise<SupportMessageEntity> {
    const row = await this.prisma.supportMessage.update({
      where: { id: input.id },
      data: {
        answer: input.answer,
        answeredById: input.answeredById,
        answeredAt: input.answeredAt,
        status: SupportMessageStatus.ANSWERED,
      },
    });

    return this.toEntity(row);
  }

  private toEntity(row: PrismaSupportMessage): SupportMessageEntity {
    return {
      id: row.id,
      authorId: row.authorId,
      title: row.title,
      content: row.content,
      answer: row.answer ?? null,
      answeredById: row.answeredById ?? null,
      answeredAt: row.answeredAt ?? null,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
