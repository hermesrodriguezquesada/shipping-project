import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { UserActionAlertType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

@InputType()
export class AdminUserActionAlertListInput {
  @Field(() => UserActionAlertType, { nullable: true })
  @IsOptional()
  @IsEnum(UserActionAlertType)
  type?: UserActionAlertType;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}