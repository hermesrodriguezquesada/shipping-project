import { Field, InputType, ID } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { BeneficiaryRelationship, DocumentType } from '@prisma/client';

@InputType()
export class UpdateBeneficiaryInput {
  @Field(() => ID)
  @IsString()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(2)
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  addressLine1?: string;

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

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @Field(() => BeneficiaryRelationship, { nullable: true })
  @IsOptional()
  @IsEnum(BeneficiaryRelationship)
  relationship?: BeneficiaryRelationship;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;
}
