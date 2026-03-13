import { Field, InputType } from '@nestjs/graphql';
import { ClientType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(6)
  password: string;

  @Field(() => ClientType, { nullable: true })
  @IsOptional()
  @IsEnum(ClientType)
  clientType?: ClientType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  companyName?: string;
}
