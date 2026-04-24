import { Injectable } from '@nestjs/common';
import { Prisma, User as PrismaUser, UserActionLog as PrismaUserActionLog } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import {
  AdminUserActionLogListFilters,
  AdminUserActionLogReportFilters,
  UserActionLogActivityBucket,
  UserActionLogPagination,
  UserActionLogListFilters,
  UserActionLogQueryPort,
  UserActionLogSummary,
  UserActionLogTopAction,
  UserActionLogTopActor,
} from '../../domain/ports/user-action-log-query.port';
import { UserActionLogEntity } from '../../domain/entities/user-action-log.entity';

type UserActionLogWithActor = PrismaUserActionLog & {
  actor: PrismaUser | null;
};

type SummaryRow = {
  totalActions: number | bigint;
  uniqueActors: number | bigint;
};

type ActivityByDayRow = {
  date: string;
  actionCount: number | bigint;
  uniqueActors: number | bigint;
};

type TopActorRow = {
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  actionCount: number | bigint;
  lastActionAt: Date;
};

type TopActionRow = {
  action: UserActionLogEntity['action'];
  actionCount: number | bigint;
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
      where: this.buildAdminWhere(filters),
      include: INCLUDE_ACTOR,
      orderBy: { createdAt: 'desc' },
      skip: pagination.offset ?? 0,
      take: pagination.limit ?? 50,
    });

    return rows.map((row) => this.toEntity(row));
  }

  async getAdminSummary(filters: AdminUserActionLogReportFilters): Promise<UserActionLogSummary> {
    const whereSql = this.buildAdminWhereSql(filters);
    const [row] = await this.prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
      SELECT
        COUNT(*) AS "totalActions",
        COUNT(DISTINCT "actorUserId") AS "uniqueActors"
      FROM "UserActionLog"
      WHERE ${whereSql}
    `);

    return {
      totalActions: Number(row?.totalActions ?? 0),
      uniqueActors: Number(row?.uniqueActors ?? 0),
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };
  }

  async getAdminActivityByDay(filters: AdminUserActionLogReportFilters): Promise<UserActionLogActivityBucket[]> {
    const whereSql = this.buildAdminWhereSql(filters);
    const rows = await this.prisma.$queryRaw<ActivityByDayRow[]>(Prisma.sql`
      SELECT
        TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') AS "date",
        COUNT(*) AS "actionCount",
        COUNT(DISTINCT "actorUserId") AS "uniqueActors"
      FROM "UserActionLog"
      WHERE ${whereSql}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `);

    return rows.map((row) => ({
      date: row.date,
      actionCount: Number(row.actionCount),
      uniqueActors: Number(row.uniqueActors),
    }));
  }

  async getAdminTopActors(filters: AdminUserActionLogReportFilters, limit: number): Promise<UserActionLogTopActor[]> {
    const whereSql = this.buildAdminWhereSql(filters);
    const rows = await this.prisma.$queryRaw<TopActorRow[]>(Prisma.sql`
      SELECT
        "actorUserId",
        "actorEmail",
        "actorRole",
        COUNT(*) AS "actionCount",
        MAX("createdAt") AS "lastActionAt"
      FROM "UserActionLog"
      WHERE ${whereSql}
      GROUP BY "actorUserId", "actorEmail", "actorRole"
      ORDER BY COUNT(*) DESC, MAX("createdAt") DESC
      LIMIT ${limit}
    `);

    return rows.map((row) => ({
      actorUserId: row.actorUserId,
      actorEmail: row.actorEmail,
      actorRole: row.actorRole,
      actionCount: Number(row.actionCount),
      lastActionAt: row.lastActionAt,
    }));
  }

  async getAdminTopActions(filters: AdminUserActionLogReportFilters): Promise<UserActionLogTopAction[]> {
    const whereSql = this.buildAdminWhereSql(filters);
    const rows = await this.prisma.$queryRaw<TopActionRow[]>(Prisma.sql`
      SELECT
        "action",
        COUNT(*) AS "actionCount"
      FROM "UserActionLog"
      WHERE ${whereSql}
      GROUP BY "action"
      ORDER BY COUNT(*) DESC, "action" ASC
    `);

    return rows.map((row) => ({
      action: row.action,
      actionCount: Number(row.actionCount),
    }));
  }

  async listAdminForExport(
    filters: AdminUserActionLogReportFilters,
    pagination: UserActionLogPagination,
  ): Promise<UserActionLogEntity[]> {
    const rows = await this.prisma.userActionLog.findMany({
      where: this.buildAdminWhere(filters),
      include: INCLUDE_ACTOR,
      orderBy: { createdAt: 'desc' },
      skip: pagination.offset ?? 0,
      take: pagination.limit ?? 200,
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

  private buildAdminWhere(filters: AdminUserActionLogListFilters | AdminUserActionLogReportFilters): Prisma.UserActionLogWhereInput {
    return {
      actorUserId: filters.actorUserId,
      resourceType: filters.resourceType,
      resourceId: filters.resourceId,
      ...this.buildCommonWhere(filters),
    };
  }

  private buildAdminWhereSql(filters: AdminUserActionLogReportFilters): Prisma.Sql {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`"createdAt" >= ${filters.dateFrom}`,
      Prisma.sql`"createdAt" <= ${filters.dateTo}`,
    ];

    if (filters.actorUserId) {
      conditions.push(Prisma.sql`"actorUserId" = ${filters.actorUserId}`);
    }

    if (filters.action) {
      conditions.push(Prisma.sql`"action" = ${filters.action}::"UserActionLogAction"`);
    }

    if (filters.resourceType) {
      conditions.push(Prisma.sql`"resourceType" = ${filters.resourceType}`);
    }

    if (filters.resourceId) {
      conditions.push(Prisma.sql`"resourceId" = ${filters.resourceId}`);
    }

    return Prisma.join(conditions, ' AND ');
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