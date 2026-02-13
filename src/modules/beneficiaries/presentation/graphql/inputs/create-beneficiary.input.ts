import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { BeneficiaryRelationship, DocumentType } from '@prisma/client';

@InputType()
export class CreateBeneficiaryInput {
  @Field()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @Field({ nullable: true })
  @IsString()
  phone!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field()
  @IsString()
  @MinLength(2)
  country!: string;

  @Field({ nullable: true })
  @IsString()
  city?: string;

  @Field({ nullable: true })
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

  @Field({ nullable: true })
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
