import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateSupportMessageInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}
