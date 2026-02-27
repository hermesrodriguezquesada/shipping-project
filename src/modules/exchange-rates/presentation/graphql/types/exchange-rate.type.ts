import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CurrencyCatalogType } from 'src/modules/catalogs/presentation/graphql/types/currency-catalog.type';

@ObjectType()
export class ExchangeRateType {
  @Field(() => ID)
  id!: string;

  @Field(() => CurrencyCatalogType)
  fromCurrency!: CurrencyCatalogType;

  @Field(() => CurrencyCatalogType)
  toCurrency!: CurrencyCatalogType;

  @Field()
  rate!: string;

  @Field()
  enabled!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
