import { Field, InputType } from '@nestjs/graphql';
import { IdentityStatus } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class AdminReviewIdentityInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @Field(() => IdentityStatus)
  status!: IdentityStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
