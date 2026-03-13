import { Field, InputType } from '@nestjs/graphql';
import { ClientType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { GraphQLISODateTime } from '@nestjs/graphql';

@InputType()
export class UpdateMyProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @MinLength(2)
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(2)
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  phone?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  birthDate?: Date;

  @Field({ nullable: true }) 
  @IsOptional() 
  addressLine1?: string;

  @Field({ nullable: true }) 
  @IsOptional() 
  addressLine2?: string;

  @Field({ nullable: true }) 
  @IsOptional() 
  city?: string;

  @Field({ nullable: true }) 
  @IsOptional() 
  country?: string;

  @Field({ nullable: true }) 
  @IsOptional() 
  postalCode?: string;

  @Field(() => ClientType, { nullable: true })
  @IsOptional()
  @IsEnum(ClientType)
  clientType?: ClientType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  companyName?: string;
}
