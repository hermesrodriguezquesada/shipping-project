import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  OriginAccountHolderType,
  RemittanceStatus,
} from '@prisma/client';
import { BeneficiaryType } from 'src/modules/beneficiaries/presentation/graphql/types/beneficiary.type';
import { CurrencyCatalogType } from 'src/modules/catalogs/presentation/graphql/types/currency-catalog.type';
import { PaymentMethodType } from 'src/modules/catalogs/presentation/graphql/types/payment-method.type';
import { ReceptionMethodType } from 'src/modules/catalogs/presentation/graphql/types/reception-method.type';
import { TransferType } from './transfer.type';

@ObjectType()
export class RemittanceType {
  @Field(() => ID)
  id!: string;

  @Field(() => RemittanceStatus)
  status!: RemittanceStatus;

  @Field()
  amount!: string;

  @Field(() => CurrencyCatalogType, { nullable: true })
  currency?: CurrencyCatalogType | null;

  @Field(() => String, { nullable: true })
  originZelleEmail?: string | null;

  @Field(() => String, { nullable: true })
  originIban?: string | null;

  @Field(() => String, { nullable: true })
  originStripePaymentMethodId?: string | null;

  @Field(() => ReceptionMethodType, { nullable: true })
  receptionMethod?: ReceptionMethodType | null;

  @Field(() => String, { nullable: true })
  destinationCupCardNumber?: string | null;

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

  @Field(() => TransferType, { nullable: true })
  transfer?: TransferType | null;

  @Field(() => PaymentMethodType, { nullable: true })
  paymentMethod?: PaymentMethodType | null;

  @Field(() => ReceptionMethodType, { nullable: true })
  receptionMethodCatalog?: ReceptionMethodType | null;

  @Field(() => CurrencyCatalogType, { nullable: true })
  paymentCurrency?: CurrencyCatalogType | null;

  @Field(() => CurrencyCatalogType, { nullable: true })
  receivingCurrency?: CurrencyCatalogType | null;

  @Field(() => String, { nullable: true })
  paymentMethodCode?: string | null;

  @Field(() => String, { nullable: true })
  receptionMethodCode?: string | null;

  @Field(() => String, { nullable: true })
  paymentDetails?: string | null;

  @Field(() => String, { nullable: true })
  statusDescription?: string | null;

  @Field(() => String, { nullable: true })
  exchangeRateRateUsed?: string | null;

  @Field(() => Date, { nullable: true })
  exchangeRateUsedAt?: Date | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
