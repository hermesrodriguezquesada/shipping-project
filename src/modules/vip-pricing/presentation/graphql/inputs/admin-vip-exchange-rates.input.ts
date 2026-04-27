import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class AdminVipExchangeRatesInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fromCurrencyCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  toCurrencyCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}