import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ReceptionPayoutMethod } from '@prisma/client';
import { CurrencyCatalogType } from './currency-catalog.type';

@ObjectType()
export class ReceptionMethodType {
  @Field(() => ID)
  id!: string;

  @Field()
  code!: string;

  @Field()
  name!: string;

  @Field(() => CurrencyCatalogType)
  currency!: CurrencyCatalogType;

  @Field(() => ReceptionPayoutMethod)
  method!: ReceptionPayoutMethod;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  enabled!: boolean;

  @Field(() => String, { nullable: true })
  imgUrl?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
