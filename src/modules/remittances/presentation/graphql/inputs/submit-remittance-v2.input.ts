import { Field, ID, InputType } from '@nestjs/graphql';
import { OriginAccountHolderType, OriginAccountType, ReceptionMethod } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class SubmitRemittanceV2OriginAccountHolderInput {
  @Field(() => OriginAccountHolderType)
  @IsEnum(OriginAccountHolderType)
  holderType!: OriginAccountHolderType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  companyName?: string;
}

@InputType()
export class SubmitRemittanceV2OriginAccountInput {
  @Field(() => OriginAccountType)
  @IsEnum(OriginAccountType)
  originAccountType!: OriginAccountType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  iban?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  zelleEmail?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  stripePaymentMethodId?: string;
}

@InputType()
export class SubmitRemittanceV2DeliveryLocationInput {
  @Field()
  @IsString()
  country!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  region?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;
}

@InputType()
export class SubmitRemittanceV2Input {
  @Field(() => ID)
  @IsUUID()
  beneficiaryId!: string;

  @Field()
  @IsString()
  paymentAmount!: string;

  @Field()
  @IsString()
  paymentCurrencyCode!: string;

  @Field()
  @IsString()
  receivingCurrencyCode!: string;

  @Field(() => ReceptionMethod)
  @IsEnum(ReceptionMethod)
  receptionMethod!: ReceptionMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  destinationCupCardNumber?: string;

  @Field(() => SubmitRemittanceV2OriginAccountHolderInput)
  @ValidateNested()
  @Type(() => SubmitRemittanceV2OriginAccountHolderInput)
  originAccountHolder!: SubmitRemittanceV2OriginAccountHolderInput;

  @Field(() => SubmitRemittanceV2OriginAccountInput)
  @ValidateNested()
  @Type(() => SubmitRemittanceV2OriginAccountInput)
  originAccount!: SubmitRemittanceV2OriginAccountInput;

  @Field(() => SubmitRemittanceV2DeliveryLocationInput)
  @ValidateNested()
  @Type(() => SubmitRemittanceV2DeliveryLocationInput)
  deliveryLocation!: SubmitRemittanceV2DeliveryLocationInput;
}
