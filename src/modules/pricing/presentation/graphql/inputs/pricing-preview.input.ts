import { Field, InputType } from '@nestjs/graphql';
import { OriginAccountHolderType } from '@prisma/client';

@InputType()
export class PricingPreviewInput {
  @Field()
  amount!: string;

  @Field()
  paymentCurrencyCode!: string;

  @Field()
  receivingCurrencyCode!: string;

  @Field(() => OriginAccountHolderType, { nullable: true })
  holderType?: OriginAccountHolderType;

  @Field()
  country!: string;

  @Field({ nullable: true })
  region?: string;

  @Field({ nullable: true })
  city?: string;
}
