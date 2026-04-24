import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { NotFoundDomainException } from '../../../../core/exceptions/domain/not-found.exception';
import { UnauthorizedDomainException } from '../../../../core/exceptions/domain/unauthorized.exception';
import { VIP_PAYMENT_PROOF_QUERY_PORT, VIP_PAYMENT_PROOF_STORAGE_PORT } from '../../../../shared/constants/tokens';
import { VipPaymentProofQueryPort } from '../../domain/ports/vip-payment-proof-query.port';
import { VipPaymentProofStoragePort } from '../../domain/ports/vip-payment-proof-storage.port';

const VIEW_URL_TTL_SECONDS = 5 * 60;

@Injectable()
export class GetVipPaymentProofViewUrlUseCase {
  constructor(
    @Inject(VIP_PAYMENT_PROOF_QUERY_PORT)
    private readonly query: VipPaymentProofQueryPort,
    @Inject(VIP_PAYMENT_PROOF_STORAGE_PORT)
    private readonly storage: VipPaymentProofStoragePort,
  ) {}

  async execute(input: {
    id: string;
    requesterUserId: string;
    requesterRoles: Role[];
  }): Promise<{ viewUrl: string; expiresAt: Date }> {
    const proof = await this.query.findById(input.id);
    if (!proof) {
      throw new NotFoundDomainException('Vip payment proof not found');
    }

    const isOwner = proof.userId === input.requesterUserId;
    const isAdminOrEmployee = input.requesterRoles.includes(Role.ADMIN) || input.requesterRoles.includes(Role.EMPLOYEE);
    if (!isOwner && !isAdminOrEmployee) {
      throw new UnauthorizedDomainException('Forbidden');
    }

    const exists = await this.storage.exists({ key: proof.paymentProofKey });
    if (!exists) {
      throw new NotFoundDomainException('Vip payment proof file not found');
    }

    const viewUrl = await this.storage.createPresignedViewUrl({
      key: proof.paymentProofKey,
      expiresInSeconds: VIEW_URL_TTL_SECONDS,
    });

    return {
      viewUrl,
      expiresAt: new Date(Date.now() + VIEW_URL_TTL_SECONDS * 1000),
    };
  }
}