import { Inject, Injectable } from '@nestjs/common';
import { VipPaymentProofStatus } from '@prisma/client';
import { VipPaymentProofEntity } from '../../domain/entities/vip-payment-proof.entity';
import { VipPaymentProofQueryPort } from '../../domain/ports/vip-payment-proof-query.port';
import { VIP_PAYMENT_PROOF_QUERY_PORT } from '../../../../shared/constants/tokens';

@Injectable()
export class ListMyVipPaymentProofsUseCase {
  constructor(
    @Inject(VIP_PAYMENT_PROOF_QUERY_PORT)
    private readonly query: VipPaymentProofQueryPort,
  ) {}

  async execute(input: {
    userId: string;
    status?: VipPaymentProofStatus;
    currencyId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    offset?: number;
    limit?: number;
  }): Promise<VipPaymentProofEntity[]> {
    return this.query.listMine(
      {
        userId: input.userId,
        status: input.status,
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