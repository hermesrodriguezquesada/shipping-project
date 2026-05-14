import { Injectable } from '@nestjs/common';
import {
  CurrencyCatalog,
  PaymentRequest,
  PaymentRequestMethod,
  PaymentRequestStatus,
  Prisma,
  User,
} from '@prisma/client';
import { PrismaService } from '../../../../core/database/prisma.service';
import { NotFoundDomainException } from '../../../../core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from '../../../../core/exceptions/domain/validation.exception';
import { CurrencyCatalogReadModel } from '../../../catalogs/domain/ports/catalogs-query.port';
import { UserEntity } from '../../../users/domain/entities/user.entity';
import { PaymentRequestEntity } from '../../domain/entities/payment-request.entity';
import { PaymentRequestFilters, PaymentRequestPagination, PaymentRequestQueryPort } from '../../domain/ports/payment-request-query.port';

const ACTIVE_STATUSES: PaymentRequestStatus[] = [
  PaymentRequestStatus.REQUESTED,
  PaymentRequestStatus.RENEGOTIATING,
  PaymentRequestStatus.ACCEPTED,
];

type PaymentRequestRow = PaymentRequest & {
  owner: User;
  currency: CurrencyCatalog;
  reviewedBy: User | null;
  paidBy: User | null;
};

const INCLUDE_RELATIONS = {
  owner: true,
  currency: true,
  reviewedBy: true,
  paidBy: true,
} as const;

function toUserEntity(u: User): UserEntity {
  return u as unknown as UserEntity;
}

function toCurrencyReadModel(c: CurrencyCatalog): CurrencyCatalogReadModel {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    description: c.description,
    enabled: c.enabled,
    imgUrl: c.imgUrl,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function toEntity(row: PaymentRequestRow): PaymentRequestEntity {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    amount: row.amount,
    currencyId: row.currencyId,
    exchangeRate: row.exchangeRate,
    deliveryFee: row.deliveryFee,
    amountToPay: row.amountToPay,
    method: row.method,
    account: row.account,
    address: row.address,
    delivery: row.delivery,
    newAmount: row.newAmount,
    status: row.status,
    reviewedById: row.reviewedById,
    reviewedAt: row.reviewedAt,
    paidById: row.paidById,
    paidAt: row.paidAt,
    canceledReason: row.canceledReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    owner: toUserEntity(row.owner),
    currency: toCurrencyReadModel(row.currency),
    reviewedBy: row.reviewedBy ? toUserEntity(row.reviewedBy) : null,
    paidBy: row.paidBy ? toUserEntity(row.paidBy) : null,
  };
}

@Injectable()
export class PrismaPaymentRequestQueryAdapter implements PaymentRequestQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PaymentRequestEntity | null> {
    const row = await this.prisma.paymentRequest.findUnique({
      where: { id },
      include: INCLUDE_RELATIONS,
    });
    return row ? toEntity(row) : null;
  }

  async findByIdOrThrow(id: string): Promise<PaymentRequestEntity> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundDomainException('Payment request not found');
    }
    return entity;
  }

  async findMany(filters: PaymentRequestFilters, pagination: PaymentRequestPagination): Promise<PaymentRequestEntity[]> {
    const { offset = 0, limit = 20 } = pagination;
    const rows = await this.prisma.paymentRequest.findMany({
      where: {
        ...(filters.ownerUserId ? { ownerUserId: filters.ownerUserId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.method ? { method: filters.method } : {}),
        ...(filters.dateFrom || filters.dateTo
          ? {
              createdAt: {
                ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
                ...(filters.dateTo ? { lte: filters.dateTo } : {}),
              },
            }
          : {}),
      },
      include: INCLUDE_RELATIONS,
      skip: offset,
      take: Math.min(limit, 100),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toEntity);
  }

  async sumActiveAmountsUsd(ownerUserId: string): Promise<Prisma.Decimal> {
    const rows = await this.prisma.paymentRequest.findMany({
      where: {
        ownerUserId,
        status: { in: ACTIVE_STATUSES },
      },
      select: { amount: true, exchangeRate: true },
    });
    return rows.reduce(
      (sum, row) => sum.add(row.amount.div(row.exchangeRate)),
      new Prisma.Decimal(0),
    );
  }
}
