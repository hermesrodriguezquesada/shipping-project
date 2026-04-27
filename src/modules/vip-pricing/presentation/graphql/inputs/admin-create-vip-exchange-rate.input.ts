import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

@InputType()
export class AdminCreateVipExchangeRateInput {
  @Field()
  @IsString()
  fromCurrencyCode!: string;

  @Field()
  @IsString()
  toCurrencyCode!: string;

  @Field()
  @IsString()
  rate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}