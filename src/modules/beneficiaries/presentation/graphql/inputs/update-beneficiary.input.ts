import { Field, InputType, ID } from '@nestjs/graphql';
import { IsEmail, IsOptional, MinLength } from 'class-validator';
import { BeneficiaryRelationship, DocumentType } from '@prisma/client';

@InputType()
export class UpdateBeneficiaryInput {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(2)
  fullName?: string;

  @Field({ nullable: true })
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  addressLine1?: string;

  @Field({ nullable: true })
  @IsOptional()
  postalCode?: string;

  @Field(() => DocumentType, { nullable: true })
  @IsOptional()
  documentType?: DocumentType;

  @Field({ nullable: true })
  @IsOptional()
  documentNumber?: string;

  @Field(() => BeneficiaryRelationship, { nullable: true })
  @IsOptional()
  relationship?: BeneficiaryRelationship;
}
