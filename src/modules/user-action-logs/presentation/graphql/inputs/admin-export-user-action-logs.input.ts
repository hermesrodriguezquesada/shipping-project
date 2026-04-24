import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { AdminUserActionLogReportInput } from './admin-user-action-log-report.input';

@InputType()
export class AdminExportUserActionLogsInput extends AdminUserActionLogReportInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}