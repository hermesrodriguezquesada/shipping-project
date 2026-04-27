import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class VipProfitPreviewInput {
  @Field()
  @IsString()
  paymentAmount!: string;

  @Field()
  @IsString()
  fromCurrencyCode!: string;

  @Field()
  @IsString()
  toCurrencyCode!: string;
}