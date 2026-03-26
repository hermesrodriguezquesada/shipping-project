import { Field, ID, InputType } from '@nestjs/graphql';
import { OriginAccountHolderType, ReceptionMethod } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BeneficiaryRelationship, DocumentType } from '@prisma/client';
import GraphQLJSON from 'graphql-type-json';

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
  @Field()
  @IsString()
  paymentMethodCode!: string;

  @Field(() => GraphQLJSON)
  @IsObject()
  data!: Record<string, unknown>;
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
export class ManualBeneficiaryInput {
  @Field()
  @IsString()
  fullName!: string;

  @Field()
  @IsString()
  phone!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field()
  @IsString()
  country!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field()
  @IsString()
  addressLine1!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @Field(() => DocumentType, { nullable: true })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @Field()
  @IsString()
  documentNumber!: string;

  @Field(() => BeneficiaryRelationship, { nullable: true })
  @IsOptional()
  @IsEnum(BeneficiaryRelationship)
  relationship?: BeneficiaryRelationship;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;
}

@InputType()
export class SubmitRemittanceV2Input {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @Field(() => ManualBeneficiaryInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ManualBeneficiaryInput)
  manualBeneficiary?: ManualBeneficiaryInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  saveManualBeneficiary?: boolean;

  @Field()
  @IsString()
  paymentAmount!: string;

  @Field()
  @IsString()
  paymentCurrencyCode!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  receivingCurrencyCode?: string;

  @Field(() => ReceptionMethod)
  @IsEnum(ReceptionMethod)
  receptionMethod!: ReceptionMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  destinationAccountNumber?: string;

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
