import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class AdminUpdatePaymentMethodAdditionalDataInput {
  @Field()
  @IsString()
  code!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  additionalData?: string;
}
