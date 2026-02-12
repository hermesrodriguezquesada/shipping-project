import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, MinLength } from 'class-validator';
import { BeneficiaryRelationship, DocumentType } from '@prisma/client';

@InputType()
export class CreateBeneficiaryInput {
  @Field()
  @MinLength(2)
  fullName!: string;

  @Field({ nullable: true })
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field()
  country!: string;

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
