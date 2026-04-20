import { Injectable } from '@nestjs/common';
import { SupportMessage as PrismaSupportMessage, User as PrismaUser } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { OffsetPagination } from 'src/shared/utils/pagination';
import { SupportMessageEntity } from '../../domain/entities/support-message.entity';
import { SupportMessageQueryPort } from '../../domain/ports/support-message-query.port';

type SupportMessageWithUsers = PrismaSupportMessage & {
  author: PrismaUser | null;
  answeredBy: PrismaUser | null;
};

const INCLUDE_USERS = { author: true, answeredBy: true } as const;

@Injectable()
export class PrismaSupportMessageQueryAdapter implements SupportMessageQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SupportMessageEntity | null> {
    const row = await this.prisma.supportMessage.findUnique({
      where: { id },
      include: INCLUDE_USERS,
    });
    return row ? this.toEntity(row) : null;
  }

  async listByAuthor(authorId: string, pagination: OffsetPagination): Promise<SupportMessageEntity[]> {
    const { offset = 0, limit = 50 } = pagination;
    const rows = await this.prisma.supportMessage.findMany({
      where: { authorId },
      include: INCLUDE_USERS,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toEntity(row));
  }

  async listAll(pagination: OffsetPagination): Promise<SupportMessageEntity[]> {
    const { offset = 0, limit = 50 } = pagination;
    const rows = await this.prisma.supportMessage.findMany({
      include: INCLUDE_USERS,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toEntity(row));
  }

  private toEntity(row: SupportMessageWithUsers): SupportMessageEntity {
    return {
      id: row.id,
      authorId: row.authorId ?? null,
      email: row.email ?? null,
      phone: row.phone ?? null,
      title: row.title,
      content: row.content,
      answer: row.answer ?? null,
      answeredById: row.answeredById ?? null,
      answeredAt: row.answeredAt ?? null,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author ? this.toUserEntity(row.author) : null,
      answeredBy: row.answeredBy ? this.toUserEntity(row.answeredBy) : null,
    };
  }

  private toUserEntity(user: PrismaUser): UserEntity {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      roles: user.roles,
      isActive: user.isActive,
      isDeleted: user.isDeleted,
      isVip: user.isVip,
      totalGeneratedAmount: user.totalGeneratedAmount,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      birthDate: user.birthDate,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      city: user.city,
      country: user.country,
      postalCode: user.postalCode,
      clientType: user.clientType,
      companyName: user.companyName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
