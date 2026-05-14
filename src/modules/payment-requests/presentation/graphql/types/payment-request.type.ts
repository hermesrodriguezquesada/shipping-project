import { Field, ID, ObjectType } from '@nestjs/graphql';
import { PaymentRequestMethod, PaymentRequestStatus } from '@prisma/client';
import { CurrencyCatalogType } from '../../../../catalogs/presentation/graphql/types/currency-catalog.type';
import { UserType } from '../../../../users/presentation/graphql/types/user.type';

@ObjectType('PaymentRequest')
export class PaymentRequestType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  ownerUserId!: string;

  @Field(() => UserType)
  owner!: UserType;

  @Field(() => String)
  amount!: string;

  @Field(() => ID)
  currencyId!: string;

  @Field(() => CurrencyCatalogType)
  currency!: CurrencyCatalogType;

  @Field(() => String)
  exchangeRate!: string;

  @Field(() => String)
  deliveryFee!: string;

  @Field(() => String)
  amountToPay!: string;

  @Field(() => PaymentRequestMethod)
  method!: PaymentRequestMethod;

  @Field(() => String, { nullable: true })
  account?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field()
  delivery!: boolean;

  @Field(() => String, { nullable: true })
  newAmount?: string | null;

  @Field(() => PaymentRequestStatus)
  status!: PaymentRequestStatus;

  @Field(() => ID, { nullable: true })
  reviewedById?: string | null;

  @Field(() => UserType, { nullable: true })
  reviewedBy?: UserType | null;

  @Field(() => Date, { nullable: true })
  reviewedAt?: Date | null;

  @Field(() => ID, { nullable: true })
  paidById?: string | null;

  @Field(() => UserType, { nullable: true })
  paidBy?: UserType | null;

  @Field(() => Date, { nullable: true })
  paidAt?: Date | null;

  @Field(() => String, { nullable: true })
  canceledReason?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
