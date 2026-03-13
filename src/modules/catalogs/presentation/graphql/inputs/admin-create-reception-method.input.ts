import { Field, InputType } from '@nestjs/graphql';
import { ReceptionPayoutMethod } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

@InputType()
export class AdminCreateReceptionMethodInput {
  @Field()
  @IsString()
  code!: string;

  @Field()
  @IsString()
  name!: string;

  @Field()
  @IsString()
  currencyCode!: string;

  @Field(() => ReceptionPayoutMethod)
  @IsEnum(ReceptionPayoutMethod)
  method!: ReceptionPayoutMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imgUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
