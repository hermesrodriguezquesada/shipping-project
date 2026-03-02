import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class AdminUpdateCommissionRuleInput {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  thresholdAmount?: string;

  @Field({ nullable: true })
  percentRate?: string;

  @Field({ nullable: true })
  flatFee?: string;

  @Field(() => Boolean, { nullable: true })
  enabled?: boolean;
}
