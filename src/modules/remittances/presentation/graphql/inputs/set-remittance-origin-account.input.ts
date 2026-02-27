import { Field, ID, InputType } from '@nestjs/graphql';
import { OriginAccountType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class SetRemittanceOriginAccountInput {
  @Field(() => ID)
  @IsUUID()
  remittanceId!: string;

  @Field(() => OriginAccountType)
  @IsEnum(OriginAccountType)
  originAccountType!: OriginAccountType;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  zelleEmail?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  iban?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  stripePaymentMethodId?: string;
}
