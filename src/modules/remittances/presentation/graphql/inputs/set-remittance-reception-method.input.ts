import { Field, ID, InputType } from '@nestjs/graphql';
import { ReceptionMethod } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

@InputType()
export class SetRemittanceReceptionMethodInput {
  @Field(() => ID)
  @IsUUID()
  remittanceId!: string;

  @Field(() => ReceptionMethod)
  @IsEnum(ReceptionMethod)
  receptionMethod!: ReceptionMethod;
}
