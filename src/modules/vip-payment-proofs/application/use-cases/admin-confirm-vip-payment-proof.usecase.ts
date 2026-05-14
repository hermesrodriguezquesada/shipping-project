import { Inject, Injectable, Logger } from '@nestjs/common';
import { InternalNotificationType, Prisma, VipPaymentProofStatus } from '@prisma/client';
import { NotFoundDomainException } from '../../../../core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from '../../../../core/exceptions/domain/validation.exception';
import { InternalNotificationCommandPort } from '../../../internal-notifications/domain/ports/internal-notification-command.port';
import { ExchangeRateQueryPort } from '../../../vip-pricing/domain/ports/exchange-rate-query.port';
import { INTERNAL_NOTIFICATION_COMMAND_PORT, VIP_PAYMENT_PROOF_COMMAND_PORT, VIP_PAYMENT_PROOF_QUERY_PORT } from '../../../../shared/constants/tokens';
import { VipPaymentProofEntity } from '../../domain/entities/vip-payment-proof.entity';
import { VipPaymentProofCommandPort } from '../../domain/ports/vip-payment-proof-command.port';
import { VipPaymentProofQueryPort } from '../../domain/ports/vip-payment-proof-query.port';

@Injectable()
export class AdminConfirmVipPaymentProofUseCase {
  private readonly logger = new Logger(AdminConfirmVipPaymentProofUseCase.name);

  constructor(
    @Inject(VIP_PAYMENT_PROOF_QUERY_PORT)
    private readonly query: VipPaymentProofQueryPort,
    @Inject(VIP_PAYMENT_PROOF_COMMAND_PORT)
    private readonly command: VipPaymentProofCommandPort,
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly notificationCommand: InternalNotificationCommandPort,
    @Inject(ExchangeRateQueryPort)
    private readonly exchangeRateQuery: ExchangeRateQueryPort,
  ) {}

  async execute(input: { id: string; reviewedById: string }): Promise<VipPaymentProofEntity> {
    const proof = await this.query.findById(input.id);
    if (!proof) {
      throw new NotFoundDomainException('Vip payment proof not found');
    }

    if (proof.status !== VipPaymentProofStatus.PENDING_CONFIRMATION) {
      throw new ValidationDomainException('Only PENDING_CONFIRMATION vip payment proofs can be confirmed');
    }

    if (!proof.currency) {
      throw new ValidationDomainException('Proof currency information is missing');
    }

    const amountUsd = await this.resolveAmountUsd(proof.amount, proof.currency.code);

    const updated = await this.command.confirmPending({
      id: input.id,
      reviewedById: input.reviewedById,
      reviewedAt: new Date(),
      amountUsd,
    });

    if (!updated) {
      throw new ValidationDomainException('Only PENDING_CONFIRMATION vip payment proofs can be confirmed');
    }

    const confirmed = await this.query.findById(input.id);
    if (!confirmed) {
      throw new NotFoundDomainException('Vip payment proof not found after confirm');
    }

    await this.notifyOwnerSafe(confirmed.userId, confirmed.id);

    return confirmed;
  }

  private async resolveAmountUsd(amount: Prisma.Decimal, currencyCode: string): Promise<Prisma.Decimal> {
    if (currencyCode === 'USD') {
      return amount;
    }

    // Try: USD → currency (divide by rate)
    const rateFromUsd = await this.exchangeRateQuery.findRate({
      fromCurrencyCode: 'USD',
      toCurrencyCode: currencyCode,
    });
    if (rateFromUsd) {
      return amount.div(new Prisma.Decimal(rateFromUsd.rate));
    }

    // Try: currency → USD (multiply by rate)
    const rateToUsd = await this.exchangeRateQuery.findRate({
      fromCurrencyCode: currencyCode,
      toCurrencyCode: 'USD',
    });
    if (rateToUsd) {
      return amount.mul(new Prisma.Decimal(rateToUsd.rate));
    }

    throw new ValidationDomainException('Exchange rate to USD not configured');
  }

  private async notifyOwnerSafe(userId: string, referenceId: string): Promise<void> {
    try {
      await this.notificationCommand.create({
        userId,
        type: InternalNotificationType.CONFIRMED_PAYMENT_PROOF,
        referenceId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Non-blocking notification failure for CONFIRMED_PAYMENT_PROOF. userId=${userId} referenceId=${referenceId} error=${message}`,
      );
    }
  }
}