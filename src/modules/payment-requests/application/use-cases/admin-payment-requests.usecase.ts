import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_REQUEST_QUERY_PORT } from '../../../../shared/constants/tokens';
import { PaymentRequestQueryPort, PaymentRequestFilters, PaymentRequestPagination } from '../../domain/ports/payment-request-query.port';
import { PaymentRequestEntity } from '../../domain/entities/payment-request.entity';

@Injectable()
export class AdminPaymentRequestsUseCase {
  constructor(
    @Inject(PAYMENT_REQUEST_QUERY_PORT)
    private readonly query: PaymentRequestQueryPort,
  ) {}

  async execute(
    filters: PaymentRequestFilters,
    pagination: PaymentRequestPagination,
  ): Promise<PaymentRequestEntity[]> {
    return this.query.findMany(filters, pagination);
  }
}
