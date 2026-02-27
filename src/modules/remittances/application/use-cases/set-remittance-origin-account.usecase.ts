import { Inject, Injectable } from '@nestjs/common';
import { OriginAccountType } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { PAYMENT_METHOD_AVAILABILITY_PORT, REMITTANCE_COMMAND_PORT, REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { PaymentMethodAvailabilityPort } from '../../domain/ports/payment-method-availability.port';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';

@Injectable()
export class SetRemittanceOriginAccountUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
    @Inject(PAYMENT_METHOD_AVAILABILITY_PORT)
    private readonly paymentMethodAvailability: PaymentMethodAvailabilityPort,
  ) {}

  async execute(input: {
    remittanceId: string;
    senderUserId: string;
    originAccountType: OriginAccountType;
    zelleEmail?: string | null;
    iban?: string | null;
    stripePaymentMethodId?: string | null;
  }): Promise<boolean> {
    const remittance = await this.remittanceQuery.findByIdAndSenderUser({
      id: input.remittanceId,
      senderUserId: input.senderUserId,
    });

    if (!remittance) {
      throw new NotFoundDomainException('Remittance not found');
    }

    const paymentMethod = await this.paymentMethodAvailability.findEnabledPaymentMethodByCode({ code: input.originAccountType });
    if (!paymentMethod) {
      throw new ValidationDomainException('originAccountType is not enabled');
    }

    this.validateByType(input);

    await this.remittanceCommand.setOriginAccount({
      id: input.remittanceId,
      paymentMethodCode: input.originAccountType,
      originZelleEmail: input.originAccountType === OriginAccountType.ZELLE ? input.zelleEmail!.trim().toLowerCase() : null,
      originIban: input.originAccountType === OriginAccountType.IBAN ? input.iban!.trim() : null,
      originStripePaymentMethodId:
        input.originAccountType === OriginAccountType.STRIPE ? input.stripePaymentMethodId!.trim() : null,
    });

    return true;
  }

  private validateByType(input: {
    originAccountType: OriginAccountType;
    zelleEmail?: string | null;
    iban?: string | null;
    stripePaymentMethodId?: string | null;
  }): void {
    const hasZelleEmail = this.hasValue(input.zelleEmail);
    const hasIban = this.hasValue(input.iban);
    const hasStripePaymentMethodId = this.hasValue(input.stripePaymentMethodId);

    if (input.originAccountType === OriginAccountType.ZELLE) {
      if (!hasZelleEmail) throw new ValidationDomainException('zelleEmail is required for ZELLE');
      if (hasIban || hasStripePaymentMethodId) {
        throw new ValidationDomainException('iban and stripePaymentMethodId are not allowed for ZELLE');
      }
      return;
    }

    if (input.originAccountType === OriginAccountType.IBAN) {
      if (!hasIban) throw new ValidationDomainException('iban is required for IBAN');
      if (hasZelleEmail || hasStripePaymentMethodId) {
        throw new ValidationDomainException('zelleEmail and stripePaymentMethodId are not allowed for IBAN');
      }
      return;
    }

    if (!hasStripePaymentMethodId) {
      throw new ValidationDomainException('stripePaymentMethodId is required for STRIPE');
    }

    if (hasZelleEmail || hasIban) {
      throw new ValidationDomainException('zelleEmail and iban are not allowed for STRIPE');
    }
  }

  private hasValue(value?: string | null): boolean {
    return value !== undefined && value !== null && value.trim().length > 0;
  }
}
