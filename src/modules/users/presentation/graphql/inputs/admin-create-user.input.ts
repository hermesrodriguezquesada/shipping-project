import { Field, InputType } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { IsEmail, IsOptional, MinLength } from 'class-validator';

@InputType()
export class AdminCreateUserInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @MinLength(6)
  password!: string;

  @Field(() => [Role], { nullable: true })
  @IsOptional()
  roles?: Role[];
}
