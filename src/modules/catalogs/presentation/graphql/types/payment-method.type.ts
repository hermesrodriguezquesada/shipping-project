import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { PaymentMethodType as PaymentMethodKind } from '@prisma/client';

registerEnumType(PaymentMethodKind, { name: 'PaymentMethodKind' });

@ObjectType()
export class PaymentMethodType {
  @Field(() => ID)
  id!: string;

  @Field()
  code!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => PaymentMethodKind)
  type!: PaymentMethodKind;

  @Field(() => String, { nullable: true })
  additionalData?: string | null;

  @Field()
  enabled!: boolean;

  @Field(() => String, { nullable: true })
  imgUrl?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
