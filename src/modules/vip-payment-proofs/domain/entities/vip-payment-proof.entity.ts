import { Prisma, VipPaymentProofStatus } from '@prisma/client';
import { CurrencyCatalogReadModel } from '../../../catalogs/domain/ports/catalogs-query.port';
import { UserEntity } from '../../../users/domain/entities/user.entity';

export type VipPaymentProofEntity = {
  id: string;
  userId: string;
  accountHolderName: string;
  amount: Prisma.Decimal;
  currencyId: string;
  paymentProofKey: string;
  status: VipPaymentProofStatus;
  cancelReason?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: UserEntity;
  currency?: CurrencyCatalogReadModel;
  reviewedBy?: UserEntity | null;
};