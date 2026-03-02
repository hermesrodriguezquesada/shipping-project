import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AdminCreateDeliveryFeeRuleInput {
  @Field()
  currencyCode!: string;

  @Field()
  country!: string;

  @Field(() => String, { nullable: true })
  region?: string;

  @Field(() => String, { nullable: true })
  city?: string;

  @Field()
  amount!: string;

  @Field(() => Boolean, { nullable: true })
  enabled?: boolean;
}
