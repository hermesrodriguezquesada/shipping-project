import { Injectable } from '@nestjs/common';
import { Prisma, User as PrismaUser, UserActionAlert as PrismaUserActionAlert, UserActionAlertType } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { UserActionAlertEntity } from '../../domain/entities/user-action-alert.entity';
import {
  AdminUserActionAlertListFilters,
  UserActionAlertPagination,
  UserActionAlertQueryPort,
} from '../../domain/ports/user-action-alert-query.port';

type UserActionAlertWithActor = PrismaUserActionAlert & {
  actor: PrismaUser | null;
};

const INCLUDE_ACTOR = { actor: true } as const;

@Injectable()
export class PrismaUserActionAlertQueryAdapter implements UserActionAlertQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listAdmin(
    filters: AdminUserActionAlertListFilters,
    pagination: UserActionAlertPagination,
  ): Promise<UserActionAlertEntity[]> {
    const rows = await this.prisma.userActionAlert.findMany({
      where: this.buildWhere(filters),
      include: INCLUDE_ACTOR,
      orderBy: { createdAt: 'desc' },
      skip: pagination.offset ?? 0,
      take: pagination.limit ?? 50,
    });

    return rows.map((row) => this.toEntity(row));
  }

  async existsRecentDuplicate(type: UserActionAlertType, actorUserId: string, dateFrom: Date): Promise<boolean> {
    const row = await this.prisma.userActionAlert.findFirst({
      where: {
        type,
        actorUserId,
        createdAt: {
          gte: dateFrom,
        },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    return Boolean(row);
  }

  private buildWhere(filters: AdminUserActionAlertListFilters): Prisma.UserActionAlertWhereInput {
    return {
      type: filters.type,
      actorUserId: filters.actorUserId,
      createdAt:
        filters.dateFrom || filters.dateTo
          ? {
              gte: filters.dateFrom,
              lte: filters.dateTo,
            }
          : undefined,
    };
  }

  private toEntity(row: UserActionAlertWithActor): UserActionAlertEntity {
    return {
      id: row.id,
      type: row.type,
      actorUserId: row.actorUserId,
      actorEmail: row.actorEmail,
      actorRole: row.actorRole,
      description: row.description,
      metadataJson: row.metadataJson,
      createdAt: row.createdAt,
      actor: row.actor ? this.toUserEntity(row.actor) : null,
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