import { Inject, Injectable } from '@nestjs/common';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceQueryPort, RemittanceReadModel } from '../../domain/ports/remittance-query.port';
import { RemittanceStatus } from '@prisma/client';

@Injectable()
export class AdminTransactionsUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
  ) {}

  async execute(input: {
    status?: RemittanceStatus;
    userId?: string;
    dateFrom: Date;
    dateTo: Date;
    paymentMethodCode?: string;
    limit?: number;
    offset?: number;
  }): Promise<RemittanceReadModel[]> {
    if (input.dateFrom > input.dateTo) {
      throw new ValidationDomainException('dateFrom must be less than or equal to dateTo');
    }

    return this.remittanceQuery.listAdminTransactions(input);
  }
}
