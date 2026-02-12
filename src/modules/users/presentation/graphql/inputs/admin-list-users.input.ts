import { Field, InputType, Int } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { IsEmail, IsInt, IsOptional, Min } from 'class-validator';

@InputType()
export class AdminListUsersInput {
  @Field({ nullable: true })
  @IsOptional()
  id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => Role, { nullable: true })
  @IsOptional()
  role?: Role;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  isDeleted?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
