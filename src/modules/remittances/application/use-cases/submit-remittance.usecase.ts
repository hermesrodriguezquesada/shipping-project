import { Inject, Injectable } from '@nestjs/common';
import {
  OriginAccountHolderType,
  OriginAccountType,
  Prisma,
  ReceptionMethod,
  RemittanceStatus,
} from '@prisma/client';
import { AppConfigService } from 'src/core/config/config.service';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { REMITTANCE_COMMAND_PORT, REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';

@Injectable()
export class SubmitRemittanceUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
    private readonly config: AppConfigService,
  ) {}

  async execute(input: { remittanceId: string; senderUserId: string }): Promise<boolean> {
    const remittance = await this.remittanceQuery.findByIdAndSenderUser({
      id: input.remittanceId,
      senderUserId: input.senderUserId,
    });

    if (!remittance) {
      throw new NotFoundDomainException('Remittance not found');
    }

    if (remittance.status !== RemittanceStatus.DRAFT) {
      throw new ValidationDomainException('Only DRAFT remittances can be submitted');
    }

    this.validateAmount(remittance.amount);
    this.validateOriginAccount(remittance.paymentMethodCode, {
      zelleEmail: remittance.originZelleEmail,
      iban: remittance.originIban,
      stripePaymentMethodId: remittance.originStripePaymentMethodId,
    });

    if (!remittance.receptionMethodCode) {
      throw new ValidationDomainException('receptionMethod is required');
    }

    this.validateHolder(remittance.originAccountHolderType, {
      firstName: remittance.originAccountHolderFirstName,
      lastName: remittance.originAccountHolderLastName,
      companyName: remittance.originAccountHolderCompanyName,
    });

    if (remittance.receptionMethodCode === ReceptionMethod.CUP_TRANSFER && !this.hasValue(remittance.destinationCupCardNumber)) {
      throw new ValidationDomainException('destinationCupCardNumber is required for CUP_TRANSFER');
    }

    const exchangeSnapshot = await this.resolveExchangeRateSnapshot(remittance.currencyId, remittance.receivingCurrencyId);

    await this.remittanceCommand.submit({
      id: input.remittanceId,
      exchangeRateIdUsed: exchangeSnapshot?.id,
      exchangeRateRateUsed: exchangeSnapshot?.rate,
      exchangeRateUsedAt: exchangeSnapshot ? new Date() : undefined,
    });

    return true;
  }

  private validateAmount(amount: Prisma.Decimal): void {
    const min = new Prisma.Decimal(this.config.remittanceAmountMin);
    const max = new Prisma.Decimal(this.config.remittanceAmountMax);

    if (amount.lte(0)) {
      throw new ValidationDomainException('Amount must be greater than 0');
    }

    if (amount.lt(min)) {
      throw new ValidationDomainException(`Amount must be greater than or equal to ${min.toString()}`);
    }

    if (amount.gt(max)) {
      throw new ValidationDomainException(`Amount must be less than or equal to ${max.toString()}`);
    }
  }

  private validateOriginAccount(
    paymentMethodCode: string | null,
    fields: { zelleEmail: string | null; iban: string | null; stripePaymentMethodId: string | null },
  ): void {
    if (!paymentMethodCode) {
      throw new ValidationDomainException('originAccountType is required');
    }

    if (paymentMethodCode !== OriginAccountType.ZELLE && paymentMethodCode !== OriginAccountType.IBAN && paymentMethodCode !== OriginAccountType.STRIPE) {
      throw new ValidationDomainException('originAccountType is required');
    }

    const originAccountType = paymentMethodCode as OriginAccountType;

    const hasZelleEmail = this.hasValue(fields.zelleEmail);
    const hasIban = this.hasValue(fields.iban);
    const hasStripePaymentMethodId = this.hasValue(fields.stripePaymentMethodId);

    if (originAccountType === OriginAccountType.ZELLE) {
      if (!hasZelleEmail || hasIban || hasStripePaymentMethodId) {
        throw new ValidationDomainException('Origin account fields are invalid for ZELLE');
      }
      return;
    }

    if (originAccountType === OriginAccountType.IBAN) {
      if (!hasIban || hasZelleEmail || hasStripePaymentMethodId) {
        throw new ValidationDomainException('Origin account fields are invalid for IBAN');
      }
      return;
    }

    if (!hasStripePaymentMethodId || hasZelleEmail || hasIban) {
      throw new ValidationDomainException('Origin account fields are invalid for STRIPE');
    }
  }

  private validateHolder(
    holderType: OriginAccountHolderType | null,
    fields: { firstName: string | null; lastName: string | null; companyName: string | null },
  ): void {
    if (!holderType) {
      throw new ValidationDomainException('originAccountHolderType is required');
    }

    const hasFirstName = this.hasValue(fields.firstName);
    const hasLastName = this.hasValue(fields.lastName);
    const hasCompanyName = this.hasValue(fields.companyName);

    if (holderType === OriginAccountHolderType.PERSON) {
      if (!hasFirstName || !hasLastName || hasCompanyName) {
        throw new ValidationDomainException('Origin account holder fields are invalid for PERSON');
      }
      return;
    }

    if (!hasCompanyName || hasFirstName || hasLastName) {
      throw new ValidationDomainException('Origin account holder fields are invalid for COMPANY');
    }
  }

  private hasValue(value?: string | null): boolean {
    return value !== undefined && value !== null && value.trim().length > 0;
  }

  private async resolveExchangeRateSnapshot(
    currencyId: string | null,
    receivingCurrencyId: string | null,
  ): Promise<{ id: string; rate: Prisma.Decimal } | null> {
    if (!currencyId || !receivingCurrencyId) {
      throw new ValidationDomainException('receiving currency is required');
    }

    const fromCurrency = await this.remittanceQuery.findCurrencyById({ id: currencyId });
    const toCurrency = await this.remittanceQuery.findCurrencyById({ id: receivingCurrencyId });

    if (!fromCurrency || !toCurrency) {
      throw new ValidationDomainException('Remittance currency is invalid');
    }

    const rate = await this.remittanceQuery.getLatestExchangeRate({
      fromCode: fromCurrency.code,
      toCode: toCurrency.code,
    });

    if (!rate) {
      throw new ValidationDomainException('Exchange rate is not available for selected currencies');
    }

    return { id: rate.id, rate: rate.rate };
  }
}
