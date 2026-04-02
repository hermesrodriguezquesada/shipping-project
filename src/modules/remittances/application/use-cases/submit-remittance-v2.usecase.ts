import { Inject, Injectable } from '@nestjs/common';
import {
  BeneficiaryRelationship,
  DocumentType,
  OriginAccountHolderType,
  Prisma,
  ReceptionMethod,
  ReceptionPayoutMethod,
} from '@prisma/client';
import { AppConfigService } from 'src/core/config/config.service';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { PricingCalculatorService } from 'src/modules/pricing/application/services/pricing-calculator.service';
import {
  BENEFICIARY_COMMAND_PORT,
  BENEFICIARY_QUERY_PORT,
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
import { BeneficiaryCommandPort } from 'src/modules/beneficiaries/domain/ports/beneficiary-command.port';
import { BeneficiaryQueryPort } from 'src/modules/beneficiaries/domain/ports/beneficiary-query.port';
import { BeneficiaryEntity } from 'src/modules/beneficiaries/domain/entities/beneficiary.entity';

@Injectable()
export class SubmitRemittanceV2UseCase {
  constructor(
    @Inject(BENEFICIARY_COMMAND_PORT)
    private readonly beneficiaryCommand: BeneficiaryCommandPort,
    @Inject(BENEFICIARY_QUERY_PORT)
    private readonly beneficiaryQuery: BeneficiaryQueryPort,
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
    beneficiaryId?: string;
    manualBeneficiary?: {
      fullName: string;
      phone: string;
      email?: string;
      country: string;
      city?: string;
      addressLine1: string;
      addressLine2?: string;
      postalCode?: string;
      documentType?: DocumentType;
      documentNumber: string;
      relationship?: BeneficiaryRelationship;
      deliveryInstructions?: string;
    };
    saveManualBeneficiary?: boolean;
    paymentAmount: string;
    paymentCurrencyCode: string;
    receivingCurrencyCode?: string;
    receptionMethod: ReceptionMethod;
    destinationAccountNumber?: string | null;
    originAccountHolder: {
      holderType: OriginAccountHolderType;
      firstName?: string;
      lastName?: string;
      companyName?: string;
    };
    originAccount: {
      paymentMethodCode: string;
      data: Record<string, unknown>;
    };
    deliveryLocation: {
      country: string;
      region?: string;
      city?: string;
    };
  }): Promise<RemittanceReadModel> {
    const hasBeneficiaryId = !!input.beneficiaryId;
    const hasManualBeneficiary = !!input.manualBeneficiary;

    if (hasBeneficiaryId === hasManualBeneficiary) {
      throw new ValidationDomainException('Exactly one of beneficiaryId or manualBeneficiary must be provided');
    }

    let beneficiary: BeneficiaryEntity;

    if (input.beneficiaryId) {
      const existingBeneficiary = await this.beneficiaryQuery.findById({
        id: input.beneficiaryId,
        ownerUserId: input.senderUserId,
      });

      if (!existingBeneficiary) {
        throw new NotFoundDomainException('Beneficiary not found');
      }

      beneficiary = existingBeneficiary;
    } else {
      const manualBeneficiary = input.manualBeneficiary!;
      beneficiary = await this.beneficiaryCommand.create({
        ownerUserId: input.senderUserId,
        fullName: manualBeneficiary.fullName,
        phone: manualBeneficiary.phone,
        email: manualBeneficiary.email,
        country: manualBeneficiary.country,
        city: manualBeneficiary.city,
        addressLine1: manualBeneficiary.addressLine1,
        addressLine2: manualBeneficiary.addressLine2,
        postalCode: manualBeneficiary.postalCode,
        documentType: manualBeneficiary.documentType,
        documentNumber: manualBeneficiary.documentNumber,
        relationship: manualBeneficiary.relationship,
        deliveryInstructions: manualBeneficiary.deliveryInstructions,
        isVisibleToOwner: input.saveManualBeneficiary ?? true,
      });
    }

    const amount = this.parseAmount(input.paymentAmount);
    this.validateAmount(amount);

    const paymentMethodCode = input.originAccount.paymentMethodCode.trim().toUpperCase();

    const paymentMethod = await this.paymentMethodAvailability.findEnabledPaymentMethodByCode({
      code: paymentMethodCode,
    });
    if (!paymentMethod) {
      throw new ValidationDomainException('paymentMethodCode is not enabled');
    }

    const receptionMethod = await this.receptionMethodAvailability.findEnabledReceptionMethodByCode({
      code: input.receptionMethod,
    });
    if (!receptionMethod) {
      throw new ValidationDomainException('receptionMethod is not enabled');
    }

    const destinationAccountNumber = input.destinationAccountNumber?.trim() ?? null;
    if (receptionMethod.method === ReceptionPayoutMethod.TRANSFER && !destinationAccountNumber) {
      throw new ValidationDomainException('destinationAccountNumber is required for TRANSFER reception methods');
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
    const originAccountData = this.resolveOriginAccountData(input.originAccount.data);

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

    const effectiveCommissionAmount = new Prisma.Decimal(0);
    const effectiveCommissionRuleId: string | null = null;
    const effectiveCommissionRuleVersion: number | null = null;
    const effectiveCommissionCurrencyIdUsed: string | null = null;
    const effectiveNetReceivingAmount = amount.minus(pricing.deliveryFeeAmount).mul(pricing.exchangeRateValue);

    const feesBreakdownJson = JSON.stringify({
      paymentAmount: amount.toString(),
      paymentCurrencyCode,
      commission: {
        ruleId: effectiveCommissionRuleId,
        version: effectiveCommissionRuleVersion,
        amount: effectiveCommissionAmount.toString(),
        currencyCode: null,
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
      receivingAmount: effectiveNetReceivingAmount.toString(),
      receivingCurrencyCode: effectiveReceivingCurrencyCode,
    });

    const remittanceId = await this.remittanceCommand.createPendingPayment({
      senderUserId: input.senderUserId,
      beneficiaryId: beneficiary.id,
      recipientFullName: beneficiary.fullName,
      recipientPhone: beneficiary.phone,
      recipientCountry: beneficiary.country,
      recipientAddressLine1: beneficiary.addressLine1,
      recipientDocumentNumber: beneficiary.documentNumber,
      recipientEmail: beneficiary.email ?? null,
      recipientCity: beneficiary.city ?? null,
      recipientAddressLine2: beneficiary.addressLine2 ?? null,
      recipientPostalCode: beneficiary.postalCode ?? null,
      recipientDocumentType: beneficiary.documentType ?? null,
      recipientRelationship: beneficiary.relationship ?? null,
      recipientDeliveryInstructions: beneficiary.deliveryInstructions ?? null,
      paymentAmount: amount,
      paymentMethodCode,
      originAccountData,
      paymentCurrencyId: paymentCurrency.id,
      receivingCurrencyId: receivingCurrency.id,
      receptionMethod: input.receptionMethod,
      destinationAccountNumber,
      originAccountHolderType: input.originAccountHolder.holderType,
      originAccountHolderFirstName: holderFields.firstName,
      originAccountHolderLastName: holderFields.lastName,
      originAccountHolderCompanyName: holderFields.companyName,
      exchangeRateIdUsed: pricing.exchangeRateId,
      exchangeRateRateUsed: pricing.exchangeRateValue,
      exchangeRateUsedAt: new Date(),
      commissionRuleIdUsed: effectiveCommissionRuleId,
      commissionRuleVersionUsed: effectiveCommissionRuleVersion,
      commissionAmount: effectiveCommissionAmount,
      commissionCurrencyIdUsed: effectiveCommissionCurrencyIdUsed,
      deliveryFeeRuleIdUsed: pricing.deliveryFeeRuleId,
      deliveryFeeAmount: pricing.deliveryFeeAmount,
      deliveryFeeCurrencyIdUsed: paymentCurrency.id,
      netReceivingAmount: effectiveNetReceivingAmount,
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

  private resolveOriginAccountData(data: Record<string, unknown>): Prisma.InputJsonValue {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new ValidationDomainException('originAccount.data must be a JSON object');
    }
    return data as Prisma.InputJsonValue;
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
