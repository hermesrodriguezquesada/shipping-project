import { Injectable } from '@nestjs/common';
import { OriginAccountHolderType, Prisma } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { PricingCalculatorService } from '../services/pricing-calculator.service';

export interface PricingPreviewReadModel {
  commissionAmount: Prisma.Decimal;
  commissionCurrencyCode: string;
  commissionRuleId: string;
  commissionRuleVersion: number;
  deliveryFeeAmount: Prisma.Decimal;
  deliveryFeeCurrencyCode: string;
  deliveryFeeRuleId: string | null;
  exchangeRateId: string;
  exchangeRateRate: Prisma.Decimal;
  netReceivingAmount: Prisma.Decimal;
  netReceivingCurrencyCode: string;
}

@Injectable()
export class PricingPreviewUseCase {
  constructor(private readonly pricingCalculator: PricingCalculatorService) {}

  async execute(input: {
    amount: string;
    paymentCurrencyCode: string;
    receivingCurrencyCode: string;
    holderType?: OriginAccountHolderType;
    country: string;
    region?: string | null;
    city?: string | null;
  }): Promise<PricingPreviewReadModel> {
    const amount = new Prisma.Decimal(input.amount);

    const result = await this.pricingCalculator.calculate({
      amount,
      paymentCurrencyCode: input.paymentCurrencyCode,
      receivingCurrencyCode: input.receivingCurrencyCode,
      holderType: input.holderType ?? OriginAccountHolderType.PERSON,
      country: input.country,
      region: input.region,
      city: input.city,
    });

    if (!result.commissionRuleId || result.commissionRuleVersion === null) {
      throw new ValidationDomainException('Commission rule is not available for selected currency and holder type');
    }

    return {
      commissionAmount: result.commissionAmount,
      commissionCurrencyCode: input.paymentCurrencyCode.trim().toUpperCase(),
      commissionRuleId: result.commissionRuleId,
      commissionRuleVersion: result.commissionRuleVersion,
      deliveryFeeAmount: result.deliveryFeeAmount,
      deliveryFeeCurrencyCode: input.paymentCurrencyCode.trim().toUpperCase(),
      deliveryFeeRuleId: result.deliveryFeeRuleId,
      exchangeRateId: result.exchangeRateId,
      exchangeRateRate: result.exchangeRateValue,
      netReceivingAmount: result.netReceivingAmount,
      netReceivingCurrencyCode: input.receivingCurrencyCode.trim().toUpperCase(),
    };
  }
}
