import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('VipProfitPreview')
export class VipProfitPreviewType {
  @Field()
  paymentAmount!: string;

  @Field()
  fromCurrencyCode!: string;

  @Field()
  toCurrencyCode!: string;

  @Field()
  baseRate!: string;

  @Field()
  vipRate!: string;

  @Field()
  rateDifference!: string;

  @Field()
  vipProfitAmount!: string;

  @Field()
  profitCurrencyCode!: string;
}