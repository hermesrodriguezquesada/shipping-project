import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString, IsUUID } from 'class-validator';

@InputType()
export class SetRemittanceDestinationCupCardInput {
  @Field(() => ID)
  @IsUUID()
  remittanceId!: string;

  @Field()
  @IsString()
  destinationCupCardNumber!: string;
}
