import { Injectable } from '@nestjs/common';
import { User as PrismaUser, UserActionAlert as PrismaUserActionAlert } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { UserActionAlertEntity } from '../../domain/entities/user-action-alert.entity';
import { CreateUserActionAlertInput, UserActionAlertCommandPort } from '../../domain/ports/user-action-alert-command.port';

type UserActionAlertWithActor = PrismaUserActionAlert & {
  actor: PrismaUser | null;
};

@Injectable()
export class PrismaUserActionAlertCommandAdapter implements UserActionAlertCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserActionAlertInput): Promise<UserActionAlertEntity> {
    const row = await this.prisma.userActionAlert.create({
      data: {
        type: input.type,
        actorUserId: input.actorUserId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorRole: input.actorRole ?? null,
        description: input.description,
        metadataJson: input.metadataJson ?? null,
      },
      include: { actor: true },
    });

    return this.toEntity(row);
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