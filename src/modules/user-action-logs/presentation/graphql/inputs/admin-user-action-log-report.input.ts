import { Field, ID, InputType } from '@nestjs/graphql';
import { UserActionLogAction } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class AdminUserActionLogReportInput {
  @Field(() => Date)
  @Type(() => Date)
  @IsDate()
  dateFrom!: Date;

  @Field(() => Date)
  @Type(() => Date)
  @IsDate()
  dateTo!: Date;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @Field(() => UserActionLogAction, { nullable: true })
  @IsOptional()
  @IsEnum(UserActionLogAction)
  action?: UserActionLogAction;

  @Field(() => String, { nullable: true })
  @IsOptional()
  resourceType?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  resourceId?: string;
}