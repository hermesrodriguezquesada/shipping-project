import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PricingPreviewType {
  @Field()
  commissionAmount!: string;

  @Field()
  commissionCurrencyCode!: string;

  @Field()
  commissionRuleId!: string;

  @Field()
  commissionRuleVersion!: number;

  @Field()
  deliveryFeeAmount!: string;

  @Field()
  deliveryFeeCurrencyCode!: string;

  @Field(() => String, { nullable: true })
  deliveryFeeRuleId?: string | null;

  @Field()
  exchangeRateId!: string;

  @Field()
  exchangeRateRate!: string;

  @Field()
  netReceivingAmount!: string;

  @Field()
  netReceivingCurrencyCode!: string;
}
