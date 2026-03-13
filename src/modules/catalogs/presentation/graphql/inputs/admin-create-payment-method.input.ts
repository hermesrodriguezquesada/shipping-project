import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

@InputType()
export class AdminCreatePaymentMethodInput {
  @Field()
  @IsString()
  code!: string;

  @Field()
  @IsString()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  additionalData?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imgUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
