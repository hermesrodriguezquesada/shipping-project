import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  OriginAccountHolderType,
  Prisma,
  RemittanceStatus,
} from '@prisma/client';
import GraphQLJSON from 'graphql-type-json';
import { BeneficiaryType } from 'src/modules/beneficiaries/presentation/graphql/types/beneficiary.type';
import { CurrencyCatalogType } from 'src/modules/catalogs/presentation/graphql/types/currency-catalog.type';
import { PaymentMethodType } from 'src/modules/catalogs/presentation/graphql/types/payment-method.type';
import { ReceptionMethodType } from 'src/modules/catalogs/presentation/graphql/types/reception-method.type';
import { UserType } from 'src/modules/users/presentation/graphql/types/user.type';
import { RemittanceRecipientType } from './remittance-recipient.type';

@ObjectType()
export class RemittanceOriginAccountType {
  @Field()
  paymentMethodCode!: string;

  @Field(() => GraphQLJSON)
  data!: Prisma.JsonValue;
}

@ObjectType()
export class RemittanceType {
  @Field(() => ID)
  id!: string;

  @Field(() => RemittanceStatus)
  status!: RemittanceStatus;

  @Field(() => UserType)
  owner!: UserType;

  @Field()
  paymentAmount!: string;

  @Field(() => String, { nullable: true })
  receivingAmount?: string | null;

  @Field(() => String, { nullable: true })
  feesBreakdownJson?: string | null;

  @Field(() => RemittanceOriginAccountType, { nullable: true })
  originAccount?: RemittanceOriginAccountType | null;

  @Field(() => ReceptionMethodType, { nullable: true })
  receptionMethod?: ReceptionMethodType | null;

  @Field(() => String, { nullable: true })
  destinationAccountNumber?: string | null;

  @Field(() => OriginAccountHolderType, { nullable: true })
  originAccountHolderType?: OriginAccountHolderType | null;

  @Field(() => String, { nullable: true })
  originAccountHolderFirstName?: string | null;

  @Field(() => String, { nullable: true })
  originAccountHolderLastName?: string | null;

  @Field(() => String, { nullable: true })
  originAccountHolderCompanyName?: string | null;

  @Field(() => BeneficiaryType)
  beneficiary!: BeneficiaryType;

  @Field(() => RemittanceRecipientType)
  recipient!: RemittanceRecipientType;

  @Field(() => PaymentMethodType, { nullable: true })
  paymentMethod?: PaymentMethodType | null;

  @Field(() => CurrencyCatalogType, { nullable: true })
  paymentCurrency?: CurrencyCatalogType | null;

  @Field(() => CurrencyCatalogType, { nullable: true })
  receivingCurrency?: CurrencyCatalogType | null;

  @Field(() => String, { nullable: true })
  paymentDetails?: string | null;

  @Field(() => String, { nullable: true })
  statusDescription?: string | null;

  @Field(() => String, { nullable: true })
  appliedExchangeRate?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
