import { Inject, Injectable } from '@nestjs/common';
import { RemittanceStatus } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import {
  RemittanceQueryPort,
  TransactionsPeriodBucketReadModel,
  TransactionsPeriodGrouping,
} from '../../domain/ports/remittance-query.port';

@Injectable()
export class AdminTransactionsPeriodReportUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
  ) {}

  async execute(input: {
    dateFrom: Date;
    dateTo: Date;
    grouping: TransactionsPeriodGrouping;
    status?: RemittanceStatus;
    userId?: string;
    paymentMethodCode?: string;
  }): Promise<TransactionsPeriodBucketReadModel[]> {
    if (input.dateFrom > input.dateTo) {
      throw new ValidationDomainException('dateFrom must be less than or equal to dateTo');
    }

    return this.remittanceQuery.reportTransactionsByPeriod(input);
  }
}
