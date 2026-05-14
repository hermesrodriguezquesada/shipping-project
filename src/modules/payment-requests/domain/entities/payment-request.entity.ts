import { Prisma, PaymentRequestStatus, PaymentRequestMethod } from '@prisma/client';
import { UserEntity } from '../../../users/domain/entities/user.entity';
import { CurrencyCatalogReadModel } from '../../../catalogs/domain/ports/catalogs-query.port';

export type PaymentRequestEntity = {
  id: string;
  ownerUserId: string;
  amount: Prisma.Decimal;
  currencyId: string;
  exchangeRate: Prisma.Decimal;
  deliveryFee: Prisma.Decimal;
  amountToPay: Prisma.Decimal;
  method: PaymentRequestMethod;
  account: string | null;
  address: string | null;
  delivery: boolean;
  newAmount: Prisma.Decimal | null;
  status: PaymentRequestStatus;
  reviewedById: string | null;
  reviewedAt: Date | null;
  paidById: string | null;
  paidAt: Date | null;
  canceledReason: string | null;
  createdAt: Date;
  updatedAt: Date;

  owner?: UserEntity;
  currency?: CurrencyCatalogReadModel;
  reviewedBy?: UserEntity | null;
  paidBy?: UserEntity | null;
};
