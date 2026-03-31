import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class CreateExternalPaymentSessionInput {
  @Field(() => ID)
  @IsUUID()
  remittanceId!: string;
}
