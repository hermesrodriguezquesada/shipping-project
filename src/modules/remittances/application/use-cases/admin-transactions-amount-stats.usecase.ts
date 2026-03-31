import { Inject, Injectable } from '@nestjs/common';
import { RemittanceStatus } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceQueryPort, TransactionsAmountStatsReadModel } from '../../domain/ports/remittance-query.port';

@Injectable()
export class AdminTransactionsAmountStatsUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
  ) {}

  async execute(input: {
    dateFrom: Date;
    dateTo: Date;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
  }): Promise<TransactionsAmountStatsReadModel> {
    if (input.dateFrom > input.dateTo) {
      throw new ValidationDomainException('dateFrom must be less than or equal to dateTo');
    }

    return this.remittanceQuery.getTransactionsAmountStats(input);
  }
}
