import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  phone?: string;
}
