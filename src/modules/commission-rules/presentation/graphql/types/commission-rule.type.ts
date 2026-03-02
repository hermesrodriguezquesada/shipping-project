import { Field, ID, ObjectType } from '@nestjs/graphql';
import { OriginAccountHolderType } from '@prisma/client';
import { CurrencyCatalogType } from 'src/modules/catalogs/presentation/graphql/types/currency-catalog.type';

@ObjectType()
export class CommissionRuleType {
  @Field(() => ID)
  id!: string;

  @Field(() => CurrencyCatalogType)
  currency!: CurrencyCatalogType;

  @Field(() => OriginAccountHolderType)
  holderType!: OriginAccountHolderType;

  @Field()
  version!: number;

  @Field()
  thresholdAmount!: string;

  @Field()
  percentRate!: string;

  @Field()
  flatFee!: string;

  @Field()
  enabled!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
