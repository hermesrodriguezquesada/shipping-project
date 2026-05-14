import { Prisma, PaymentRequestMethod, PaymentRequestStatus } from '@prisma/client';
import { PaymentRequestEntity } from '../entities/payment-request.entity';

export interface PaymentRequestFilters {
  ownerUserId?: string;
  status?: PaymentRequestStatus;
  method?: PaymentRequestMethod;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaymentRequestPagination {
  offset?: number;
  limit?: number;
}

export interface PaymentRequestQueryPort {
  findById(id: string): Promise<PaymentRequestEntity | null>;
  findByIdOrThrow(id: string): Promise<PaymentRequestEntity>;
  findMany(filters: PaymentRequestFilters, pagination: PaymentRequestPagination): Promise<PaymentRequestEntity[]>;
  sumActiveAmounts(ownerUserId: string): Promise<Prisma.Decimal>;
}
