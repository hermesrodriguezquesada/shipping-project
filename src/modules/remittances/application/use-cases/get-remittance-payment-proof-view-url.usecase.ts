import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { UnauthorizedDomainException } from 'src/core/exceptions/domain/unauthorized.exception';
import {
  REMITTANCE_PAYMENT_PROOF_STORAGE_PORT,
  REMITTANCE_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';
import { RemittancePaymentProofStoragePort } from '../../domain/ports/remittance-payment-proof-storage.port';
import { extractPaymentProofKeyFromDetails } from '../utils/payment-details-proof';

const VIEW_URL_TTL_SECONDS = 5 * 60;

@Injectable()
export class GetRemittancePaymentProofViewUrlUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_PAYMENT_PROOF_STORAGE_PORT)
    private readonly storage: RemittancePaymentProofStoragePort,
  ) {}

  async execute(input: {
    remittanceId: string;
    requesterUserId: string;
    requesterRoles: Role[];
  }): Promise<{ viewUrl: string; expiresAt: Date }> {
    const remittance = await this.remittanceQuery.findRemittanceById({ id: input.remittanceId });

    if (!remittance) {
      throw new NotFoundDomainException('Remittance not found');
    }

    const isOwner = remittance.sender.id === input.requesterUserId;
    const isAdminOrEmployee = input.requesterRoles.includes(Role.ADMIN) || input.requesterRoles.includes(Role.EMPLOYEE);
    if (!isOwner && !isAdminOrEmployee) {
      throw new UnauthorizedDomainException('Forbidden');
    }

    const paymentProofKey = extractPaymentProofKeyFromDetails(remittance.paymentDetails) ?? remittance.paymentProofKey;

    if (!paymentProofKey) {
      throw new NotFoundDomainException('Payment proof not found');
    }

    const viewUrl = await this.storage.createPresignedViewUrl({
      key: paymentProofKey,
      expiresInSeconds: VIEW_URL_TTL_SECONDS,
    });

    return {
      viewUrl,
      expiresAt: new Date(Date.now() + VIEW_URL_TTL_SECONDS * 1000),
    };
  }
}
