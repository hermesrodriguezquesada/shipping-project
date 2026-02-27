import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString, IsUUID } from 'class-validator';

@InputType()
export class SetRemittanceReceivingCurrencyInput {
  @Field(() => ID)
  @IsUUID()
  remittanceId!: string;

  @Field()
  @IsString()
  currencyCode!: string;
}
