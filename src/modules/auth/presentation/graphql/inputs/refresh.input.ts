import { Field, InputType } from '@nestjs/graphql';
import { MinLength } from 'class-validator';

@InputType()
export class RefreshInput {
  @Field()
  @MinLength(10)
  refreshToken!: string;
}
