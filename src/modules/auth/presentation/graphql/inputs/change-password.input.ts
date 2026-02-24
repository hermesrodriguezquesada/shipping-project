import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  oldPassword!: string;

  @Field()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
