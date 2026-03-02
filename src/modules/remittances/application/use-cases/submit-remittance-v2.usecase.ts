import { Inject, Injectable } from '@nestjs/common';
import {
  OriginAccountHolderType,
  OriginAccountType,
  Prisma,
  ReceptionMethod,
} from '@prisma/client';
import { AppConfigService } from 'src/core/config/config.service';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { PricingCalculatorService } from 'src/modules/pricing/application/services/pricing-calculator.service';
import {
  CURRENCY_AVAILABILITY_PORT,
  PAYMENT_METHOD_AVAILABILITY_PORT,
  RECEPTION_METHOD_AVAILABILITY_PORT,
  REMITTANCE_COMMAND_PORT,
  REMITTANCE_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { CurrencyAvailabilityPort } from '../../domain/ports/currency-availability.port';
import { PaymentMethodAvailabilityPort } from '../../domain/ports/payment-method-availability.port';
import { ReceptionMethodAvailabilityPort } from '../../domain/ports/reception-method-availability.port';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort, RemittanceReadModel } from '../../domain/ports/remittance-query.port';

@Injectable()
export class SubmitRemittanceV2UseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
    @Inject(PAYMENT_METHOD_AVAILABILITY_PORT)
    private readonly paymentMethodAvailability: PaymentMethodAvailabilityPort,
    @Inject(RECEPTION_METHOD_AVAILABILITY_PORT)
    private readonly receptionMethodAvailability: ReceptionMethodAvailabilityPort,
    @Inject(CURRENCY_AVAILABILITY_PORT)
    private readonly currencyAvailability: CurrencyAvailabilityPort,
    private readonly pricingCalculator: PricingCalculatorService,
    private readonly config: AppConfigService,
  ) {}

  async execute(input: {
    senderUserId: string;
    beneficiaryId: string;
    paymentAmount: string;
    paymentCurrencyCode: string;
    receivingCurrencyCode?: string;
    receptionMethod: ReceptionMethod;
    destinationCupCardNumber?: string | null;
    originAccountHolder: {
      holderType: OriginAccountHolderType;
      firstName?: string;
      lastName?: string;
      companyName?: string;
    };
    originAccount: {
      originAccountType: OriginAccountType;
      zelleEmail?: string;
      iban?: string;
      stripePaymentMethodId?: string;
    };
    deliveryLocation: {
      country: string;
      region?: string;
      city?: string;
    };
  }): Promise<RemittanceReadModel> {
    const beneficiaryBelongsToUser = await this.remittanceQuery.beneficiaryBelongsToUser({
      beneficiaryId: input.beneficiaryId,
      ownerUserId: input.senderUserId,
    });

    if (!beneficiaryBelongsToUser) {
      throw new NotFoundDomainException('Beneficiary not found');
    }

    const amount = this.parseAmount(input.paymentAmount);
    this.validateAmount(amount);

    const paymentMethod = await this.paymentMethodAvailability.findEnabledPaymentMethodByCode({
      code: input.originAccount.originAccountType,
    });
    if (!paymentMethod) {
      throw new ValidationDomainException('originAccountType is not enabled');
    }

    const receptionMethod = await this.receptionMethodAvailability.findEnabledReceptionMethodByCode({
      code: input.receptionMethod,
    });
    if (!receptionMethod) {
      throw new ValidationDomainException('receptionMethod is not enabled');
    }

    const destinationCupCardNumber = input.destinationCupCardNumber?.trim() ?? null;
    if (input.receptionMethod === ReceptionMethod.CUP_TRANSFER && !destinationCupCardNumber) {
      throw new ValidationDomainException('destinationCupCardNumber is required for CUP_TRANSFER');
    }

    if (input.receptionMethod !== ReceptionMethod.CUP_TRANSFER && destinationCupCardNumber) {
      throw new ValidationDomainException('destinationCupCardNumber is only allowed for CUP_TRANSFER');
    }

    const paymentCurrencyCode = input.paymentCurrencyCode.trim().toUpperCase();
    const configuredReceivingCurrencyCode = receptionMethod.currencyCode.trim().toUpperCase();

    let effectiveReceivingCurrencyCode = configuredReceivingCurrencyCode;
    if (input.receivingCurrencyCode?.trim()) {
      const requestedReceivingCurrencyCode = input.receivingCurrencyCode.trim().toUpperCase();
      if (requestedReceivingCurrencyCode !== configuredReceivingCurrencyCode) {
        throw new ValidationDomainException('receivingCurrencyCode must match receptionMethod currency');
      }

      effectiveReceivingCurrencyCode = requestedReceivingCurrencyCode;
    }

    const paymentCurrency = await this.currencyAvailability.findEnabledCurrencyByCode({
      code: paymentCurrencyCode,
    });
    if (!paymentCurrency) {
      throw new ValidationDomainException('paymentCurrencyCode is not enabled');
    }

    const receivingCurrency = await this.currencyAvailability.findEnabledCurrencyByCode({
      code: effectiveReceivingCurrencyCode,
    });
    if (!receivingCurrency) {
      throw new ValidationDomainException('receivingCurrencyCode is not enabled');
    }

    const holderFields = this.resolveAndValidateHolder(input.originAccountHolder);
    const originAccountFields = this.resolveAndValidateOriginAccount(input.originAccount);

    const country = input.deliveryLocation.country?.trim().toUpperCase();
    if (!country) {
      throw new ValidationDomainException('deliveryLocation.country is required');
    }

    const region = input.deliveryLocation.region?.trim() || null;
    const city = input.deliveryLocation.city?.trim() || null;

    const pricing = await this.pricingCalculator.calculate({
      amount,
      paymentCurrencyCode,
      receivingCurrencyCode: effectiveReceivingCurrencyCode,
      holderType: input.originAccountHolder.holderType,
      country,
      city,
      region,
    });

    const feesBreakdownJson = JSON.stringify({
      paymentAmount: amount.toString(),
      paymentCurrencyCode,
      commission: {
        ruleId: pricing.commissionRuleId,
        version: pricing.commissionRuleVersion,
        amount: pricing.commissionAmount.toString(),
        currencyCode: paymentCurrencyCode,
      },
      deliveryFee: {
        ruleId: pricing.deliveryFeeRuleId,
        amount: pricing.deliveryFeeAmount.toString(),
        currencyCode: paymentCurrencyCode,
      },
      exchangeRate: {
        id: pricing.exchangeRateId,
        rate: pricing.exchangeRateValue.toString(),
        from: paymentCurrencyCode,
        to: effectiveReceivingCurrencyCode,
      },
      receivingAmount: pricing.netReceivingAmount.toString(),
      receivingCurrencyCode: effectiveReceivingCurrencyCode,
    });

    const remittanceId = await this.remittanceCommand.createPendingPayment({
      senderUserId: input.senderUserId,
      beneficiaryId: input.beneficiaryId,
      paymentAmount: amount,
      originAccountType: input.originAccount.originAccountType,
      paymentCurrencyId: paymentCurrency.id,
      receivingCurrencyId: receivingCurrency.id,
      receptionMethod: input.receptionMethod,
      destinationCupCardNumber,
      originAccountHolderType: input.originAccountHolder.holderType,
      originAccountHolderFirstName: holderFields.firstName,
      originAccountHolderLastName: holderFields.lastName,
      originAccountHolderCompanyName: holderFields.companyName,
      originZelleEmail: originAccountFields.zelleEmail,
      originIban: originAccountFields.iban,
      originStripePaymentMethodId: originAccountFields.stripePaymentMethodId,
      exchangeRateIdUsed: pricing.exchangeRateId,
      exchangeRateRateUsed: pricing.exchangeRateValue,
      exchangeRateUsedAt: new Date(),
      commissionRuleIdUsed: pricing.commissionRuleId,
      commissionRuleVersionUsed: pricing.commissionRuleVersion,
      commissionAmount: pricing.commissionAmount,
      commissionCurrencyIdUsed: paymentCurrency.id,
      deliveryFeeRuleIdUsed: pricing.deliveryFeeRuleId,
      deliveryFeeAmount: pricing.deliveryFeeAmount,
      deliveryFeeCurrencyIdUsed: paymentCurrency.id,
      netReceivingAmount: pricing.netReceivingAmount,
      netReceivingCurrencyIdUsed: receivingCurrency.id,
      feesBreakdownJson,
    });

    const remittance = await this.remittanceQuery.findMyRemittanceById({
      id: remittanceId,
      senderUserId: input.senderUserId,
    });

    if (!remittance) {
      throw new NotFoundDomainException('Remittance not found');
    }

    return remittance;
  }

  private parseAmount(value: string): Prisma.Decimal {
    const normalized = value?.trim();

    if (!normalized) {
      throw new ValidationDomainException('paymentAmount is required');
    }

    try {
      const amount = new Prisma.Decimal(normalized);

      if (!amount.isFinite()) {
        throw new ValidationDomainException('paymentAmount must be a valid decimal number');
      }

      return amount;
    } catch {
      throw new ValidationDomainException('paymentAmount must be a valid decimal number');
    }
  }

  private validateAmount(amount: Prisma.Decimal): void {
    const min = new Prisma.Decimal(this.config.remittanceAmountMin);
    const max = new Prisma.Decimal(this.config.remittanceAmountMax);

    if (amount.lte(0)) {
      throw new ValidationDomainException('paymentAmount must be greater than 0');
    }

    if (amount.lt(min)) {
      throw new ValidationDomainException(`paymentAmount must be greater than or equal to ${min.toString()}`);
    }

    if (amount.gt(max)) {
      throw new ValidationDomainException(`paymentAmount must be less than or equal to ${max.toString()}`);
    }
  }

  private resolveAndValidateOriginAccount(input: {
    originAccountType: OriginAccountType;
    zelleEmail?: string;
    iban?: string;
    stripePaymentMethodId?: string;
  }): { zelleEmail: string | null; iban: string | null; stripePaymentMethodId: string | null } {
    const zelleEmail = input.zelleEmail?.trim().toLowerCase() ?? null;
    const iban = input.iban?.trim() ?? null;
    const stripePaymentMethodId = input.stripePaymentMethodId?.trim() ?? null;

    if (input.originAccountType === OriginAccountType.ZELLE) {
      if (!zelleEmail) {
        throw new ValidationDomainException('zelleEmail is required for ZELLE');
      }

      if (iban || stripePaymentMethodId) {
        throw new ValidationDomainException('iban and stripePaymentMethodId are not allowed for ZELLE');
      }

      return { zelleEmail, iban: null, stripePaymentMethodId: null };
    }

    if (input.originAccountType === OriginAccountType.IBAN) {
      if (!iban) {
        throw new ValidationDomainException('iban is required for IBAN');
      }

      if (zelleEmail || stripePaymentMethodId) {
        throw new ValidationDomainException('zelleEmail and stripePaymentMethodId are not allowed for IBAN');
      }

      return { zelleEmail: null, iban, stripePaymentMethodId: null };
    }

    if (!stripePaymentMethodId) {
      throw new ValidationDomainException('stripePaymentMethodId is required for STRIPE');
    }

    if (zelleEmail || iban) {
      throw new ValidationDomainException('zelleEmail and iban are not allowed for STRIPE');
    }

    return { zelleEmail: null, iban: null, stripePaymentMethodId };
  }

  private resolveAndValidateHolder(input: {
    holderType: OriginAccountHolderType;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }): { firstName: string | null; lastName: string | null; companyName: string | null } {
    const firstName = input.firstName?.trim() ?? null;
    const lastName = input.lastName?.trim() ?? null;
    const companyName = input.companyName?.trim() ?? null;

    if (input.holderType === OriginAccountHolderType.PERSON) {
      if (!firstName || !lastName) {
        throw new ValidationDomainException('firstName and lastName are required for PERSON');
      }

      if (companyName) {
        throw new ValidationDomainException('companyName is not allowed for PERSON');
      }

      return {
        firstName,
        lastName,
        companyName: null,
      };
    }

    if (!companyName) {
      throw new ValidationDomainException('companyName is required for COMPANY');
    }

    if (firstName || lastName) {
      throw new ValidationDomainException('firstName and lastName are not allowed for COMPANY');
    }

    return {
      firstName: null,
      lastName: null,
      companyName,
    };
  }
}
