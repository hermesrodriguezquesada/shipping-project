import { Field, InputType } from '@nestjs/graphql';
import { OriginAccountHolderType } from '@prisma/client';

@InputType()
export class AdminCreateCommissionRuleInput {
  @Field()
  currencyCode!: string;

  @Field(() => OriginAccountHolderType)
  holderType!: OriginAccountHolderType;

  @Field()
  thresholdAmount!: string;

  @Field()
  percentRate!: string;

  @Field()
  flatFee!: string;

  @Field(() => Boolean, { nullable: true })
  enabled?: boolean;
}
