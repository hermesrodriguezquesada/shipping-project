import { Injectable } from '@nestjs/common';
import { UserActionLog as PrismaUserActionLog, User as PrismaUser } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { CreateUserActionLogInput, UserActionLogCommandPort } from '../../domain/ports/user-action-log-command.port';
import { UserActionLogEntity } from '../../domain/entities/user-action-log.entity';

type UserActionLogWithActor = PrismaUserActionLog & {
  actor: PrismaUser | null;
};

@Injectable()
export class PrismaUserActionLogCommandAdapter implements UserActionLogCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserActionLogInput): Promise<UserActionLogEntity> {
    const row = await this.prisma.userActionLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        description: input.description ?? null,
        metadataJson: input.metadataJson ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
      include: { actor: true },
    });

    return this.toEntity(row);
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