import { Injectable } from '@nestjs/common';
import { SupportMessage as PrismaSupportMessage } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { OffsetPagination } from 'src/shared/utils/pagination';
import { SupportMessageEntity } from '../../domain/entities/support-message.entity';
import { SupportMessageQueryPort } from '../../domain/ports/support-message-query.port';

@Injectable()
export class PrismaSupportMessageQueryAdapter implements SupportMessageQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SupportMessageEntity | null> {
    const row = await this.prisma.supportMessage.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async listByAuthor(authorId: string, pagination: OffsetPagination): Promise<SupportMessageEntity[]> {
    const { offset = 0, limit = 50 } = pagination;
    const rows = await this.prisma.supportMessage.findMany({
      where: { authorId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(this.toEntity);
  }

  async listAll(pagination: OffsetPagination): Promise<SupportMessageEntity[]> {
    const { offset = 0, limit = 50 } = pagination;
    const rows = await this.prisma.supportMessage.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(this.toEntity);
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
