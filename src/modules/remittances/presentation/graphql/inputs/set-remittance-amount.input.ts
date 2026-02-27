import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString, IsUUID } from 'class-validator';

@InputType()
export class SetRemittanceAmountInput {
  @Field(() => ID)
  @IsUUID()
  remittanceId!: string;

  @Field()
  @IsString()
  amount!: string;
}