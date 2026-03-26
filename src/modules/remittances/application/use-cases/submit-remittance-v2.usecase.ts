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

type OriginAccountFieldType = 'string' | 'number' | 'boolean';
type OriginAccountFieldFormat = 'email' | 'iban' | 'token';

type OriginAccountFieldDefinition = {
  type: OriginAccountFieldType;
  format?: OriginAccountFieldFormat;
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  enum?: Array<string | number | boolean>;
};

type OriginAccountMetadata = {
  schemaVersion: number;
  allowedFields: string[];
  requiredFields: string[];
  fieldDefinitions: Record<string, OriginAccountFieldDefinition>;
};

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
    const originAccountMetadata = this.parseOriginAccountMetadata(paymentMethod.additionalData, paymentMethodCode);
    const originAccountData = this.resolveAndValidateOriginAccountData(
      input.originAccount.data,
      originAccountMetadata,
      paymentMethodCode,
    );

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

  private parseOriginAccountMetadata(additionalData: string | null, paymentMethodCode: string): OriginAccountMetadata {
    if (!additionalData?.trim()) {
      throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(additionalData);
    } catch {
      throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
    }

    const metadata = parsed as Partial<OriginAccountMetadata>;

    if (!Number.isInteger(metadata.schemaVersion) || (metadata.schemaVersion ?? 0) <= 0) {
      throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
    }

    if (!Array.isArray(metadata.allowedFields) || metadata.allowedFields.length === 0) {
      throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
    }

    if (!Array.isArray(metadata.requiredFields)) {
      throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
    }

    if (!metadata.fieldDefinitions || typeof metadata.fieldDefinitions !== 'object' || Array.isArray(metadata.fieldDefinitions)) {
      throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
    }

    const allowedFields = metadata.allowedFields.map((field) => field?.toString().trim()).filter(Boolean);
    if (allowedFields.length !== metadata.allowedFields.length) {
      throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
    }

    const requiredFields = metadata.requiredFields.map((field) => field?.toString().trim()).filter(Boolean);
    if (requiredFields.length !== metadata.requiredFields.length) {
      throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
    }

    const allowedFieldSet = new Set(allowedFields);
    if (allowedFieldSet.size !== allowedFields.length) {
      throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
    }

    for (const requiredField of requiredFields) {
      if (!allowedFieldSet.has(requiredField)) {
        throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
      }
    }

    const fieldDefinitions = metadata.fieldDefinitions as Record<string, OriginAccountFieldDefinition>;
    for (const field of allowedFields) {
      const definition = fieldDefinitions[field];
      if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
        throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
      }

      if (!['string', 'number', 'boolean'].includes(definition.type)) {
        throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
      }

      if (definition.format && !['email', 'iban', 'token'].includes(definition.format)) {
        throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
      }

      if (definition.minLength !== undefined && (!Number.isInteger(definition.minLength) || definition.minLength < 0)) {
        throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
      }

      if (definition.maxLength !== undefined && (!Number.isInteger(definition.maxLength) || definition.maxLength < 0)) {
        throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
      }

      if (
        definition.minLength !== undefined &&
        definition.maxLength !== undefined &&
        definition.maxLength < definition.minLength
      ) {
        throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
      }

      if (definition.pattern !== undefined) {
        if (typeof definition.pattern !== 'string' || !definition.pattern.trim()) {
          throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
        }

        try {
          new RegExp(definition.pattern);
        } catch {
          throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
        }
      }

      if (definition.enum !== undefined) {
        if (!Array.isArray(definition.enum) || definition.enum.length === 0) {
          throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
        }

        for (const enumValue of definition.enum) {
          const enumType = typeof enumValue;
          if (enumType !== 'string' && enumType !== 'number' && enumType !== 'boolean') {
            throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
          }
        }
      }
    }

    return {
      schemaVersion: Number(metadata.schemaVersion),
      allowedFields,
      requiredFields,
      fieldDefinitions,
    };
  }

  private resolveAndValidateOriginAccountData(
    data: Record<string, unknown>,
    metadata: OriginAccountMetadata,
    paymentMethodCode: string,
  ): Prisma.InputJsonValue {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new ValidationDomainException('originAccount.data must be a JSON object');
    }

    const allowedFieldSet = new Set(metadata.allowedFields);
    const requiredFieldSet = new Set(metadata.requiredFields);
    for (const field of metadata.allowedFields) {
      const definition = metadata.fieldDefinitions[field];
      if (definition.required) {
        requiredFieldSet.add(field);
      }
    }

    for (const key of Object.keys(data)) {
      if (!allowedFieldSet.has(key)) {
        throw new ValidationDomainException(`originAccount.data.${key} is not allowed for ${paymentMethodCode}`);
      }
    }

    for (const requiredField of requiredFieldSet) {
      const value = data[requiredField];
      if (value === undefined || value === null) {
        throw new ValidationDomainException(`originAccount.data.${requiredField} is required for ${paymentMethodCode}`);
      }
    }

    const normalized: Record<string, string | number | boolean> = {};

    for (const [field, value] of Object.entries(data)) {
      const definition = metadata.fieldDefinitions[field];

      if (!definition) {
        throw new ValidationDomainException(`payment method metadata is invalid for ${paymentMethodCode}`);
      }

      let normalizedValue: string | number | boolean;

      if (definition.type === 'string') {
        if (typeof value !== 'string') {
          throw new ValidationDomainException(`originAccount.data.${field} must be a string`);
        }

        normalizedValue = value.trim();
        if (!normalizedValue) {
          throw new ValidationDomainException(`originAccount.data.${field} is required for ${paymentMethodCode}`);
        }

        if (definition.format === 'email') {
          normalizedValue = normalizedValue.toLowerCase();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(normalizedValue)) {
            throw new ValidationDomainException(`originAccount.data.${field} must be a valid email`);
          }
        }

        if (definition.format === 'iban') {
          normalizedValue = normalizedValue.replace(/\s+/g, '').toUpperCase();
          const ibanRegex = /^[A-Z]{2}[0-9A-Z]{13,34}$/;
          if (!ibanRegex.test(normalizedValue)) {
            throw new ValidationDomainException(`originAccount.data.${field} must be a valid iban`);
          }
        }

        if (definition.format === 'token' && normalizedValue.length < 3) {
          throw new ValidationDomainException(`originAccount.data.${field} must be a valid token`);
        }

        if (definition.minLength !== undefined && normalizedValue.length < definition.minLength) {
          throw new ValidationDomainException(`originAccount.data.${field} length must be >= ${definition.minLength}`);
        }

        if (definition.maxLength !== undefined && normalizedValue.length > definition.maxLength) {
          throw new ValidationDomainException(`originAccount.data.${field} length must be <= ${definition.maxLength}`);
        }

        if (definition.pattern && !new RegExp(definition.pattern).test(normalizedValue)) {
          throw new ValidationDomainException(`originAccount.data.${field} has invalid format`);
        }
      } else if (definition.type === 'number') {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new ValidationDomainException(`originAccount.data.${field} must be a number`);
        }

        normalizedValue = value;
      } else {
        if (typeof value !== 'boolean') {
          throw new ValidationDomainException(`originAccount.data.${field} must be a boolean`);
        }

        normalizedValue = value;
      }

      if (definition.enum && !definition.enum.includes(normalizedValue)) {
        throw new ValidationDomainException(`originAccount.data.${field} has unsupported value`);
      }

      normalized[field] = normalizedValue;
    }

    return normalized;
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
