import { Field, ID, InputType } from '@nestjs/graphql';
import { OriginAccountHolderType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class SetRemittanceOriginAccountHolderInput {
  @Field(() => ID)
  @IsUUID()
  remittanceId!: string;

  @Field(() => OriginAccountHolderType)
  @IsEnum(OriginAccountHolderType)
  holderType!: OriginAccountHolderType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  companyName?: string;
}
