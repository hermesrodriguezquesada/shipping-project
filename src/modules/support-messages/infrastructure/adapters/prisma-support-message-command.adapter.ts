import { Injectable } from '@nestjs/common';
import {
  SupportMessage as PrismaSupportMessage,
  SupportMessageStatus,
  User as PrismaUser,
} from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { SupportMessageEntity } from '../../domain/entities/support-message.entity';
import { SupportMessageCommandPort } from '../../domain/ports/support-message-command.port';

type SupportMessageWithUsers = PrismaSupportMessage & {
  author: PrismaUser | null;
  answeredBy: PrismaUser | null;
};

const INCLUDE_USERS = { author: true, answeredBy: true } as const;

@Injectable()
export class PrismaSupportMessageCommandAdapter implements SupportMessageCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    authorId: string | null;
    email: string | null;
    phone: string | null;
    title: string;
    content: string;
  }): Promise<SupportMessageEntity> {
    const row = await this.prisma.supportMessage.create({
      data: {
        authorId: input.authorId,
        email: input.email,
        phone: input.phone,
        title: input.title,
        content: input.content,
        status: SupportMessageStatus.OPEN,
      },
      include: INCLUDE_USERS,
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
      include: INCLUDE_USERS,
    });

    return this.toEntity(row);
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
