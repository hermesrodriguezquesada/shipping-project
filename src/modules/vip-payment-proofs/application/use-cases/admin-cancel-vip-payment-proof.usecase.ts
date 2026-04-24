import { Inject, Injectable } from '@nestjs/common';
import { VipPaymentProofStatus } from '@prisma/client';
import { NotFoundDomainException } from '../../../../core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from '../../../../core/exceptions/domain/validation.exception';
import { VIP_PAYMENT_PROOF_COMMAND_PORT, VIP_PAYMENT_PROOF_QUERY_PORT } from '../../../../shared/constants/tokens';
import { VipPaymentProofEntity } from '../../domain/entities/vip-payment-proof.entity';
import { VipPaymentProofCommandPort } from '../../domain/ports/vip-payment-proof-command.port';
import { VipPaymentProofQueryPort } from '../../domain/ports/vip-payment-proof-query.port';

@Injectable()
export class AdminCancelVipPaymentProofUseCase {
  constructor(
    @Inject(VIP_PAYMENT_PROOF_QUERY_PORT)
    private readonly query: VipPaymentProofQueryPort,
    @Inject(VIP_PAYMENT_PROOF_COMMAND_PORT)
    private readonly command: VipPaymentProofCommandPort,
  ) {}

  async execute(input: { id: string; reason: string; reviewedById: string }): Promise<VipPaymentProofEntity> {
    const proof = await this.query.findById(input.id);
    if (!proof) {
      throw new NotFoundDomainException('Vip payment proof not found');
    }

    if (proof.status !== VipPaymentProofStatus.PENDING_CONFIRMATION) {
      throw new ValidationDomainException('Only PENDING_CONFIRMATION vip payment proofs can be cancelled');
    }

    const reason = input.reason.trim();
    if (!reason) {
      throw new ValidationDomainException('reason is required');
    }

    const updated = await this.command.cancelPending({
      id: input.id,
      reason,
      reviewedById: input.reviewedById,
      reviewedAt: new Date(),
    });

    if (!updated) {
      throw new ValidationDomainException('Only PENDING_CONFIRMATION vip payment proofs can be cancelled');
    }

    const cancelled = await this.query.findById(input.id);
    if (!cancelled) {
      throw new NotFoundDomainException('Vip payment proof not found after cancel');
    }

    return cancelled;
  }
}