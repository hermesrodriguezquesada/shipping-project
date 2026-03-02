import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class AdminUpdateDeliveryFeeRuleInput {
  @Field(() => ID)
  id!: string;

  @Field(() => String, { nullable: true })
  country?: string;

  @Field(() => String, { nullable: true })
  region?: string;

  @Field(() => String, { nullable: true })
  city?: string;

  @Field(() => String, { nullable: true })
  amount?: string;

  @Field(() => Boolean, { nullable: true })
  enabled?: boolean;
}
