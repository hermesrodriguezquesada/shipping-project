import { Field, InputType } from '@nestjs/graphql';
import { DocumentType } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class SubmitIdentityInput {
  @Field(() => DocumentType)
  documentType!: DocumentType;

  @Field()
  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @Field({ nullable: true }) 
  @IsOptional() 
  birthDate?: Date;

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
  documentFrontUrl?: string;

  @Field({ nullable: true }) 
  @IsOptional() 
  documentBackUrl?: string;

  @Field({ nullable: true }) 
  @IsOptional() 
  selfieUrl?: string;
}
