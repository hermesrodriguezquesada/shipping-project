import { Injectable } from '@nestjs/common';
import { Prisma, User as PrismaUser, UserActionLog as PrismaUserActionLog } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import {
  AdminUserActionLogListFilters,
  UserActionLogPagination,
  UserActionLogListFilters,
  UserActionLogQueryPort,
} from '../../domain/ports/user-action-log-query.port';
import { UserActionLogEntity } from '../../domain/entities/user-action-log.entity';

type UserActionLogWithActor = PrismaUserActionLog & {
  actor: PrismaUser | null;
};

const INCLUDE_ACTOR = { actor: true } as const;

@Injectable()
export class PrismaUserActionLogQueryAdapter implements UserActionLogQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(
    actorUserId: string,
    filters: UserActionLogListFilters,
    pagination: UserActionLogPagination,
  ): Promise<UserActionLogEntity[]> {
    const rows = await this.prisma.userActionLog.findMany({
      where: {
        actorUserId,
        ...this.buildCommonWhere(filters),
      },
      include: INCLUDE_ACTOR,
      orderBy: { createdAt: 'desc' },
      skip: pagination.offset ?? 0,
      take: pagination.limit ?? 50,
    });

    return rows.map((row) => this.toEntity(row));
  }

  async listAdmin(
    filters: AdminUserActionLogListFilters,
    pagination: UserActionLogPagination,
  ): Promise<UserActionLogEntity[]> {
    const rows = await this.prisma.userActionLog.findMany({
      where: {
        actorUserId: filters.actorUserId,
        resourceType: filters.resourceType,
        resourceId: filters.resourceId,
        ...this.buildCommonWhere(filters),
      },
      include: INCLUDE_ACTOR,
      orderBy: { createdAt: 'desc' },
      skip: pagination.offset ?? 0,
      take: pagination.limit ?? 50,
    });

    return rows.map((row) => this.toEntity(row));
  }

  private buildCommonWhere(filters: UserActionLogListFilters): Prisma.UserActionLogWhereInput {
    return {
      action: filters.action,
      createdAt:
        filters.dateFrom || filters.dateTo
          ? {
              gte: filters.dateFrom,
              lte: filters.dateTo,
            }
          : undefined,
    };
  }

  private toEntity(row: UserActionLogWithActor): UserActionLogEntity {
    return {
      id: row.id,
      actorUserId: row.actorUserId,
      actorEmail: row.actorEmail,
      actorRole: row.actorRole,
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      description: row.description,
      metadataJson: row.metadataJson,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
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