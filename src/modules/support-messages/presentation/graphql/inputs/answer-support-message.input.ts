import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class AnswerSupportMessageInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  answer!: string;
}
