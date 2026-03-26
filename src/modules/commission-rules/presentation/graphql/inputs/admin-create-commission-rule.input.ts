import { Field, InputType } from '@nestjs/graphql';
import { OriginAccountHolderType } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class AdminCreateCommissionRuleInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  currencyCode!: string;

  @Field(() => OriginAccountHolderType)
  @IsEnum(OriginAccountHolderType)
  holderType!: OriginAccountHolderType;

  @Field()
  @IsString()
  @IsNotEmpty()
  thresholdAmount!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  percentRate!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  flatFee!: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
