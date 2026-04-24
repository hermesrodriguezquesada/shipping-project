import { VipPaymentProofStatus } from '@prisma/client';
import { OffsetPagination } from '../../../../shared/utils/pagination';
import { VipPaymentProofEntity } from '../entities/vip-payment-proof.entity';

export interface VipPaymentProofQueryPort {
  findById(id: string): Promise<VipPaymentProofEntity | null>;

  listMine(input: {
    userId: string;
    status?: VipPaymentProofStatus;
    currencyId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }, pagination: OffsetPagination): Promise<VipPaymentProofEntity[]>;

  listForAdmin(input: {
    status?: VipPaymentProofStatus;
    userId?: string;
    currencyId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }, pagination: OffsetPagination): Promise<VipPaymentProofEntity[]>;
}