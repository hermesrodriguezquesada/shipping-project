import { Inject, Injectable } from '@nestjs/common';
import { OriginAccountHolderType, Prisma } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { CommissionRuleReadModel, CommissionRulesQueryPort } from 'src/modules/commission-rules/domain/ports/commission-rules-query.port';
import { DeliveryFeeRuleReadModel, DeliveryFeesQueryPort } from 'src/modules/delivery-fees/domain/ports/delivery-fees-query.port';
import { ExchangeRatesQueryPort } from 'src/modules/exchange-rates/domain/ports/exchange-rates-query.port';
import {
  COMMISSION_RULES_QUERY_PORT,
  DELIVERY_FEES_QUERY_PORT,
  EXCHANGE_RATES_QUERY_PORT,
} from 'src/shared/constants/tokens';

export interface PricingCalculationResult {
  commissionRuleId: string;
  commissionRuleVersion: number;
  commissionAmount: Prisma.Decimal;
  deliveryFeeRuleId: string | null;
  deliveryFeeAmount: Prisma.Decimal;
  exchangeRateId: string;
  exchangeRateValue: Prisma.Decimal;
  netReceivingAmount: Prisma.Decimal;
}

@Injectable()
export class PricingCalculatorService {
  constructor(
    @Inject(COMMISSION_RULES_QUERY_PORT)
    private readonly commissionRulesQuery: CommissionRulesQueryPort,
    @Inject(DELIVERY_FEES_QUERY_PORT)
    private readonly deliveryFeesQuery: DeliveryFeesQueryPort,
    @Inject(EXCHANGE_RATES_QUERY_PORT)
    private readonly exchangeRatesQuery: ExchangeRatesQueryPort,
  ) {}

  async calculate(input: {
    amount: Prisma.Decimal;
    paymentCurrencyCode: string;
    receivingCurrencyCode: string;
    holderType: OriginAccountHolderType;
    country: string;
    region?: string | null;
    city?: string | null;
  }): Promise<PricingCalculationResult> {
    const paymentCurrencyCode = input.paymentCurrencyCode.trim().toUpperCase();
    const receivingCurrencyCode = input.receivingCurrencyCode.trim().toUpperCase();

    if (paymentCurrencyCode !== 'USD' && paymentCurrencyCode !== 'EUR') {
      throw new ValidationDomainException('Commission only supports paymentCurrencyCode USD or EUR');
    }

    if (input.amount.lte(0)) {
      throw new ValidationDomainException('amount must be greater than 0');
    }

    const commissionRule = await this.commissionRulesQuery.findApplicableRule({
      currencyCode: paymentCurrencyCode,
      holderType: input.holderType,
    });

    if (!commissionRule) {
      throw new ValidationDomainException('Commission rule is not available for selected currency and holder type');
    }

    const deliveryFeeRule = await this.deliveryFeesQuery.findApplicableRule({
      currencyCode: paymentCurrencyCode,
      country: input.country,
      region: input.region,
      city: input.city,
    });

    const exchangeRate = await this.exchangeRatesQuery.getLatestExchangeRate({
      fromCode: paymentCurrencyCode,
      toCode: receivingCurrencyCode,
    });

    if (!exchangeRate) {
      throw new ValidationDomainException('Exchange rate is not available for selected currencies');
    }

    const commissionAmount = this.calculateCommissionAmount(input.amount, commissionRule);
    const deliveryFeeAmount = this.round2(deliveryFeeRule?.amount ?? new Prisma.Decimal(0));
    const netBase = input.amount.minus(commissionAmount).minus(deliveryFeeAmount);
    const netReceivingAmount = this.round2(netBase.mul(exchangeRate.rate));

    return {
      commissionRuleId: commissionRule.id,
      commissionRuleVersion: commissionRule.version,
      commissionAmount,
      deliveryFeeRuleId: deliveryFeeRule?.id ?? null,
      deliveryFeeAmount,
      exchangeRateId: exchangeRate.id,
      exchangeRateValue: exchangeRate.rate,
      netReceivingAmount,
    };
  }

  private calculateCommissionAmount(amount: Prisma.Decimal, rule: CommissionRuleReadModel): Prisma.Decimal {
    if (amount.gt(rule.thresholdAmount)) {
      return this.round2(amount.mul(rule.percentRate));
    }

    return this.round2(rule.flatFee);
  }

  private round2(value: Prisma.Decimal): Prisma.Decimal {
    return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }
}
