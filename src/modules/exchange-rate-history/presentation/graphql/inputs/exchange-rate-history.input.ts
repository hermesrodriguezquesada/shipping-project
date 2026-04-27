import { Field, InputType, Int } from '@nestjs/graphql';
import { ExchangeRateHistoryType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

@InputType()
export class ExchangeRateHistoryInput {
  @Field(() => [ExchangeRateHistoryType], { nullable: true })
  @IsOptional()
  @IsEnum(ExchangeRateHistoryType, { each: true })
  rateTypes?: ExchangeRateHistoryType[];

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
  @IsString()
  currencyCode?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}