import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { PaymentRequestMethod, PaymentRequestStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreatePaymentRequestInput {
  @Field(() => String)
  @IsString()
  amount!: string;

  @Field(() => ID)
  @IsUUID()
  currencyId!: string;

  @Field(() => PaymentRequestMethod)
  @IsEnum(PaymentRequestMethod)
  method!: PaymentRequestMethod;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  account?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  address?: string | null;

  @Field()
  @IsBoolean()
  delivery!: boolean;
}
