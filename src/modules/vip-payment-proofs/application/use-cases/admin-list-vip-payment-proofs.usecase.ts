import { Inject, Injectable } from '@nestjs/common';
import { VipPaymentProofStatus } from '@prisma/client';
import { VIP_PAYMENT_PROOF_QUERY_PORT } from '../../../../shared/constants/tokens';
import { VipPaymentProofEntity } from '../../domain/entities/vip-payment-proof.entity';
import { VipPaymentProofQueryPort } from '../../domain/ports/vip-payment-proof-query.port';

@Injectable()
export class AdminListVipPaymentProofsUseCase {
  constructor(
    @Inject(VIP_PAYMENT_PROOF_QUERY_PORT)
    private readonly query: VipPaymentProofQueryPort,
  ) {}

  async execute(input: {
    status?: VipPaymentProofStatus;
    userId?: string;
    currencyId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    offset?: number;
    limit?: number;
  }): Promise<VipPaymentProofEntity[]> {
    return this.query.listForAdmin(
      {
        status: input.status,
        userId: input.userId,
        currencyId: input.currencyId,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      },
      {
        offset: input.offset ?? 0,
        limit: input.limit ?? 50,
      },
    );
  }
}