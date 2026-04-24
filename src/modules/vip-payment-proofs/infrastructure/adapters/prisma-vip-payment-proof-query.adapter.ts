import { Injectable } from '@nestjs/common';
import { CurrencyCatalog, Prisma, User, VipPaymentProof } from '@prisma/client';
import { PrismaService } from '../../../../core/database/prisma.service';
import { UserEntity } from '../../../users/domain/entities/user.entity';
import { OffsetPagination } from '../../../../shared/utils/pagination';
import { CurrencyCatalogReadModel } from '../../../catalogs/domain/ports/catalogs-query.port';
import { VipPaymentProofEntity } from '../../domain/entities/vip-payment-proof.entity';
import { VipPaymentProofQueryPort } from '../../domain/ports/vip-payment-proof-query.port';

type VipPaymentProofRow = VipPaymentProof & {
  user: User;
  currency: CurrencyCatalog;
  reviewedBy: User | null;
};

const INCLUDE_RELATIONS = {
  user: true,
  currency: true,
  reviewedBy: true,
} as const;

@Injectable()
export class PrismaVipPaymentProofQueryAdapter implements VipPaymentProofQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<VipPaymentProofEntity | null> {
    const row = await this.prisma.vipPaymentProof.findUnique({
      where: { id },
      include: INCLUDE_RELATIONS,
    });

    return row ? this.toEntity(row) : null;
  }

  async listMine(
    input: {
      userId: string;
      status?: import('@prisma/client').VipPaymentProofStatus;
      currencyId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    pagination: OffsetPagination,
  ): Promise<VipPaymentProofEntity[]> {
    const { offset = 0, limit = 50 } = pagination;
    const rows = await this.prisma.vipPaymentProof.findMany({
      where: {
        userId: input.userId,
        ...(input.status ? { status: input.status } : {}),
        ...(input.currencyId ? { currencyId: input.currencyId } : {}),
        ...(input.dateFrom || input.dateTo
          ? {
              createdAt: {
                ...(input.dateFrom ? { gte: input.dateFrom } : {}),
                ...(input.dateTo ? { lte: input.dateTo } : {}),
              },
            }
          : {}),
      },
      include: INCLUDE_RELATIONS,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toEntity(row));
  }

  async listForAdmin(
    input: {
      status?: import('@prisma/client').VipPaymentProofStatus;
      userId?: string;
      currencyId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    pagination: OffsetPagination,
  ): Promise<VipPaymentProofEntity[]> {
    const { offset = 0, limit = 50 } = pagination;
    const rows = await this.prisma.vipPaymentProof.findMany({
      where: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.currencyId ? { currencyId: input.currencyId } : {}),
        ...(input.dateFrom || input.dateTo
          ? {
              createdAt: {
                ...(input.dateFrom ? { gte: input.dateFrom } : {}),
                ...(input.dateTo ? { lte: input.dateTo } : {}),
              },
            }
          : {}),
      },
      include: INCLUDE_RELATIONS,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toEntity(row));
  }

  private toEntity(row: VipPaymentProofRow): VipPaymentProofEntity {
    return {
      id: row.id,
      userId: row.userId,
      accountHolderName: row.accountHolderName,
      amount: row.amount,
      currencyId: row.currencyId,
      paymentProofKey: row.paymentProofKey,
      status: row.status,
      cancelReason: row.cancelReason,
      reviewedById: row.reviewedById,
      reviewedAt: row.reviewedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: this.toUserEntity(row.user),
      currency: this.toCurrencyReadModel(row.currency),
      reviewedBy: row.reviewedBy ? this.toUserEntity(row.reviewedBy) : null,
    };
  }

  private toUserEntity(user: User): UserEntity {
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

  private toCurrencyReadModel(currency: CurrencyCatalog): CurrencyCatalogReadModel {
    return {
      id: currency.id,
      code: currency.code,
      name: currency.name,
      description: currency.description,
      enabled: currency.enabled,
      imgUrl: currency.imgUrl,
      createdAt: currency.createdAt,
      updatedAt: currency.updatedAt,
    };
  }
}