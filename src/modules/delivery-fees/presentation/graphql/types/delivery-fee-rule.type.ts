import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CurrencyCatalogType } from 'src/modules/catalogs/presentation/graphql/types/currency-catalog.type';

@ObjectType()
export class DeliveryFeeRuleType {
  @Field(() => ID)
  id!: string;

  @Field(() => CurrencyCatalogType)
  currency!: CurrencyCatalogType;

  @Field()
  country!: string;

  @Field(() => String, { nullable: true })
  region?: string | null;

  @Field(() => String, { nullable: true })
  city?: string | null;

  @Field()
  amount!: string;

  @Field()
  enabled!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
