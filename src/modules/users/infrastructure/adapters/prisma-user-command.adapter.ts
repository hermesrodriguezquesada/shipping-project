import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { UserEntity } from "../../domain/entities/user.entity";
import { Role, User as PrismaUser } from '@prisma/client';
import { UserCommandPort } from "../../domain/ports/user-command.port";

@Injectable()
export class PrismaUserCommandAdapter implements UserCommandPort {
  constructor(private readonly prisma: PrismaService) {}

    async create(input: { email: string; passwordHash: string; roles?: Role[] }): Promise<UserEntity> {
        const row = await this.prisma.user.create({
        data: { email: input.email, passwordHash: input.passwordHash, roles: input.roles ?? [Role.CLIENT] },
        });
        return this.toDomain(row);
    }

    async updateStatus(input: { id: string; isActive?: boolean; isDeleted?: boolean }): Promise<UserEntity> {
        const row = await this.prisma.user.update({
            where: { id: input.id },
            data: {
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
            ...(input.isDeleted !== undefined ? { isDeleted: input.isDeleted } : {}),
            },
        });
        return this.toDomain(row);
    }

    async updateRoles(input: { id: string; roles: Role[] }): Promise<UserEntity> {
        const row = await this.prisma.user.update({
            where: { id: input.id },
            data: { roles: input.roles },
        });
        return this.toDomain(row);
    }

private toDomain(row: PrismaUser): UserEntity {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    roles: row.roles,
    isActive: row.isActive,
    isDeleted: row.isDeleted,

    firstName: row.firstName ?? null,
    lastName: row.lastName ?? null,
    phone: row.phone ?? null,
    birthDate: row.birthDate ?? null,
    addressLine1: row.addressLine1 ?? null,
    addressLine2: row.addressLine2 ?? null,
    city: row.city ?? null,
    country: row.country ?? null,
    postalCode: row.postalCode ?? null,

    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}


async updateProfile(input: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  birthDate?: Date | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
}): Promise<UserEntity> {
  const row = await this.prisma.user.update({
    where: { id: input.id },
    data: {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : {}),
      ...(input.addressLine1 !== undefined ? { addressLine1: input.addressLine1 } : {}),
      ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
    },
  });

  return this.toDomain(row);
}

async updatePassword(input: { id: string; passwordHash: string }): Promise<UserEntity> {
  const row = await this.prisma.user.update({
    where: { id: input.id },
    data: { passwordHash: input.passwordHash },
  });
  return this.toDomain(row);
}


}