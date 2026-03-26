import { Field, InputType } from '@nestjs/graphql';
import { OriginAccountHolderType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

@InputType()
export class PricingPreviewInput {
  @Field()
  @IsString()
  amount!: string;

  @Field()
  @IsString()
  paymentCurrencyCode!: string;

  @Field()
  @IsString()
  receivingCurrencyCode!: string;

  @Field(() => OriginAccountHolderType, { nullable: true })
  @IsOptional()
  @IsEnum(OriginAccountHolderType)
  holderType?: OriginAccountHolderType;

  @Field()
  @IsString()
  country!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  region?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;
}