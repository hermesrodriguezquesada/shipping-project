import { Field, ID, InputType } from '@nestjs/graphql';
import { GraphQLISODateTime } from '@nestjs/graphql';
import { IsOptional, MinLength } from 'class-validator';

@InputType()
export class AdminUpdateUserProfileInput {
  @Field(() => ID)
  userId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(2)
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(2)
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  phone?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  birthDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  addressLine1?: string;

  @Field({ nullable: true })
  @IsOptional()
  addressLine2?: string;

  @Field({ nullable: true })
  @IsOptional()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  postalCode?: string;
}