import { Field, ID, ObjectType } from '@nestjs/graphql';
import { VipPaymentProofStatus } from '@prisma/client';
import { CurrencyCatalogType } from '../../../../catalogs/presentation/graphql/types/currency-catalog.type';
import { UserType } from '../../../../users/presentation/graphql/types/user.type';

@ObjectType('VipPaymentProof')
export class VipPaymentProofType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => UserType)
  user!: UserType;

  @Field()
  accountHolderName!: string;

  @Field(() => String)
  amount!: string;

  @Field(() => ID)
  currencyId!: string;

  @Field(() => CurrencyCatalogType)
  currency!: CurrencyCatalogType;

  @Field(() => VipPaymentProofStatus)
  status!: VipPaymentProofStatus;

  @Field(() => String, { nullable: true })
  cancelReason?: string;

  @Field(() => ID, { nullable: true })
  reviewedById?: string;

  @Field(() => UserType, { nullable: true })
  reviewedBy?: UserType;

  @Field(() => Date, { nullable: true })
  reviewedAt?: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}