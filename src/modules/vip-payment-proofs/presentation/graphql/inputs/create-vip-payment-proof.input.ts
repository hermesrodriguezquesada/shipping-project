import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateVipPaymentProofInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  accountHolderName!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  amount!: string;

  @Field(() => ID)
  @IsUUID()
  currencyId!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  paymentProofImg!: string;
}