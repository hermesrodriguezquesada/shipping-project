import { Field, InputType } from '@nestjs/graphql';
import { ClientType, Role } from '@prisma/client';
import { GraphQLISODateTime } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class AdminCreateUserInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @MinLength(6)
  password!: string;

  @Field(() => [Role], { nullable: true })
  @IsOptional()
  roles?: Role[];

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
