import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class AdminUpdateCommissionRuleInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  thresholdAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  percentRate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  flatFee?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
