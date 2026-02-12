import { Field, InputType } from '@nestjs/graphql';
import { MinLength } from 'class-validator';

@InputType()
export class LogoutInput {
  @Field()
  @MinLength(10)
  refreshToken!: string;
}
