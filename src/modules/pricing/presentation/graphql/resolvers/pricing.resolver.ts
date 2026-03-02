import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { PricingPreviewUseCase } from 'src/modules/pricing/application/use-cases/pricing-preview.usecase';
import { PricingPreviewInput } from '../inputs/pricing-preview.input';
import { PricingPreviewType } from '../types/pricing-preview.type';

@UseGuards(GqlAuthGuard)
@Resolver()
export class PricingResolver {
  constructor(private readonly pricingPreviewUseCase: PricingPreviewUseCase) {}

  @Query(() => PricingPreviewType)
  async pricingPreview(@Args('input') input: PricingPreviewInput): Promise<PricingPreviewType> {
    const result = await this.pricingPreviewUseCase.execute(input);

    return {
      commissionAmount: result.commissionAmount.toString(),
      commissionCurrencyCode: result.commissionCurrencyCode,
      commissionRuleId: result.commissionRuleId,
      commissionRuleVersion: result.commissionRuleVersion,
      deliveryFeeAmount: result.deliveryFeeAmount.toString(),
      deliveryFeeCurrencyCode: result.deliveryFeeCurrencyCode,
      deliveryFeeRuleId: result.deliveryFeeRuleId,
      exchangeRateId: result.exchangeRateId,
      exchangeRateRate: result.exchangeRateRate.toString(),
      netReceivingAmount: result.netReceivingAmount.toString(),
      netReceivingCurrencyCode: result.netReceivingCurrencyCode,
    };
  }
}
