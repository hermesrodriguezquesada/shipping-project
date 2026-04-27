import { Field, ObjectType } from '@nestjs/graphql';
import { ExchangeRateHistoryType } from '@prisma/client';

@ObjectType('ExchangeRateHistoryItem')
export class ExchangeRateHistoryItemType {
  @Field(() => ExchangeRateHistoryType)
  rateType!: ExchangeRateHistoryType;

  @Field()
  fromCurrencyCode!: string;

  @Field()
  toCurrencyCode!: string;

  @Field()
  rate!: string;

  @Field()
  createdAt!: Date;
}