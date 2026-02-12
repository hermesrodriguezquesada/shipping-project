import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { UserEntity } from "../../domain/entities/user.entity";
import { Role, User as PrismaUser } from '@prisma/client';
import { UserListQuery, UserQueryPort } from "../../domain/ports/user-query.port";
import { OffsetPagination } from "src/shared/utils/pagination";

@Injectable()
export class PrismaUserQueryAdapter implements UserQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findMany(query: UserListQuery, pagination: OffsetPagination): Promise<UserEntity[]> {
    const { offset = 0, limit = 50 } = pagination;
    const rows = await this.prisma.user.findMany({
      where: {
        ...(query.id ? { id: query.id } : {}),
        ...(query.email ? { email: query.email } : {}),
        ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
        ...(query.isDeleted !== undefined ? { isDeleted: query.isDeleted } : {}),
        ...(query.role ? { roles: { has: query.role } } : {}),
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toDomain);
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
}