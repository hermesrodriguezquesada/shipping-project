import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { NotFoundDomainException } from '../../../../core/exceptions/domain/not-found.exception';
import { UnauthorizedDomainException } from '../../../../core/exceptions/domain/unauthorized.exception';
import { ValidationDomainException } from '../../../../core/exceptions/domain/validation.exception';
import { CatalogsQueryPort } from '../../../catalogs/domain/ports/catalogs-query.port';
import { UserQueryPort } from '../../../users/domain/ports/user-query.port';
import { CATALOGS_QUERY_PORT, USER_QUERY_PORT, VIP_PAYMENT_PROOF_COMMAND_PORT, VIP_PAYMENT_PROOF_QUERY_PORT, VIP_PAYMENT_PROOF_STORAGE_PORT } from '../../../../shared/constants/tokens';
import { VipPaymentProofEntity } from '../../domain/entities/vip-payment-proof.entity';
import { VipPaymentProofCommandPort } from '../../domain/ports/vip-payment-proof-command.port';
import { VipPaymentProofQueryPort } from '../../domain/ports/vip-payment-proof-query.port';
import { VipPaymentProofStoragePort } from '../../domain/ports/vip-payment-proof-storage.port';
import { parsePaymentProofImage } from '../utils/payment-proof-image';

@Injectable()
export class CreateVipPaymentProofUseCase {
  constructor(
    @Inject(USER_QUERY_PORT)
    private readonly userQuery: UserQueryPort,
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(VIP_PAYMENT_PROOF_COMMAND_PORT)
    private readonly command: VipPaymentProofCommandPort,
    @Inject(VIP_PAYMENT_PROOF_QUERY_PORT)
    private readonly query: VipPaymentProofQueryPort,
    @Inject(VIP_PAYMENT_PROOF_STORAGE_PORT)
    private readonly storage: VipPaymentProofStoragePort,
  ) {}

  async execute(input: {
    userId: string;
    accountHolderName: string;
    amount: string;
    currencyId: string;
    paymentProofImg: string;
  }): Promise<VipPaymentProofEntity> {
    const user = await this.userQuery.findById(input.userId);
    if (!user) {
      throw new NotFoundDomainException('User not found');
    }

    if (!user.isVip) {
      throw new UnauthorizedDomainException('Only VIP users can create payment proofs');
    }

    const accountHolderName = input.accountHolderName.trim();
    if (!accountHolderName) {
      throw new ValidationDomainException('accountHolderName is required');
    }

    const amount = new Prisma.Decimal(input.amount);
    if (!amount.gt(0)) {
      throw new ValidationDomainException('amount must be greater than 0');
    }

    const currency = await this.catalogsQuery.findCurrencyById({ id: input.currencyId });
    if (!currency) {
      throw new NotFoundDomainException('Currency not found');
    }

    if (!currency.enabled) {
      throw new ValidationDomainException('Currency is not enabled');
    }

    const { mimeType, extension, body } = parsePaymentProofImage(input.paymentProofImg.trim());
    const paymentProofKey = `vip-payment-proofs/${input.userId}/${randomUUID()}${extension}`;

    await this.storage.uploadObject({ key: paymentProofKey, mimeType, body });

    const id = await this.command.create({
      userId: input.userId,
      accountHolderName,
      amount,
      currencyId: currency.id,
      paymentProofKey,
    });

    const created = await this.query.findById(id);
    if (!created) {
      throw new NotFoundDomainException('Vip payment proof not found after create');
    }

    return created;
  }
}