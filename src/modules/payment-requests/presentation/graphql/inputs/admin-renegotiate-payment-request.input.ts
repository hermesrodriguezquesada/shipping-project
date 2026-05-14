import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class AdminRenegotiatePaymentRequestInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  newAmount!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}
