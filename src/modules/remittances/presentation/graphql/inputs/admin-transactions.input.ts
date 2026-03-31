import { Field, ID, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { AdminReportExportStatus, RemittanceStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export enum AdminReportGrouping {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum AdminReportExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
}

export enum AdminReportExportDataset {
  DASHBOARD_SUMMARY = 'DASHBOARD_SUMMARY',
  TRANSACTIONS = 'TRANSACTIONS',
  PERIOD_REPORT = 'PERIOD_REPORT',
  AMOUNT_STATS = 'AMOUNT_STATS',
  PAYMENT_METHOD_USAGE = 'PAYMENT_METHOD_USAGE',
}

registerEnumType(AdminReportGrouping, {
  name: 'AdminReportGrouping',
});

registerEnumType(AdminReportExportFormat, {
  name: 'AdminReportExportFormat',
});

registerEnumType(AdminReportExportDataset, {
  name: 'AdminReportExportDataset',
});

registerEnumType(AdminReportExportStatus, {
  name: 'AdminReportExportStatus',
});

@InputType()
export class AdminTransactionsFilterInput {
  @Field()
  @Type(() => Date)
  @IsDate()
  dateFrom!: Date;

  @Field()
  @Type(() => Date)
  @IsDate()
  dateTo!: Date;

  @Field(() => RemittanceStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RemittanceStatus)
  status?: RemittanceStatus;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  paymentMethodCode?: string;

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

@InputType()
export class AdminTransactionsPeriodReportInput {
  @Field()
  @Type(() => Date)
  @IsDate()
  dateFrom!: Date;

  @Field()
  @Type(() => Date)
  @IsDate()
  dateTo!: Date;

  @Field(() => AdminReportGrouping)
  @IsEnum(AdminReportGrouping)
  grouping!: AdminReportGrouping;

  @Field(() => RemittanceStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RemittanceStatus)
  status?: RemittanceStatus;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  paymentMethodCode?: string;
}

@InputType()
export class AdminTransactionsAmountStatsInput {
  @Field()
  @Type(() => Date)
  @IsDate()
  dateFrom!: Date;

  @Field()
  @Type(() => Date)
  @IsDate()
  dateTo!: Date;

  @Field(() => RemittanceStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RemittanceStatus)
  status?: RemittanceStatus;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  paymentMethodCode?: string;
}

@InputType()
export class AdminPaymentMethodUsageInput {
  @Field()
  @Type(() => Date)
  @IsDate()
  dateFrom!: Date;

  @Field()
  @Type(() => Date)
  @IsDate()
  dateTo!: Date;

  @Field(() => RemittanceStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RemittanceStatus)
  status?: RemittanceStatus;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  paymentMethodCode?: string;
}

@InputType()
export class AdminDashboardSummaryInput {
  @Field()
  @Type(() => Date)
  @IsDate()
  dateFrom!: Date;

  @Field()
  @Type(() => Date)
  @IsDate()
  dateTo!: Date;

  @Field(() => AdminReportGrouping)
  @IsEnum(AdminReportGrouping)
  grouping!: AdminReportGrouping;

  @Field(() => RemittanceStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RemittanceStatus)
  status?: RemittanceStatus;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  paymentMethodCode?: string;

  @Field(() => Int, { nullable: true, defaultValue: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topPaymentMethodsLimit?: number;
}

@InputType()
export class AdminReportExportInput {
  @Field(() => AdminReportExportDataset)
  @IsEnum(AdminReportExportDataset)
  dataset!: AdminReportExportDataset;

  @Field(() => AdminReportExportFormat)
  @IsEnum(AdminReportExportFormat)
  format!: AdminReportExportFormat;

  @Field()
  @Type(() => Date)
  @IsDate()
  dateFrom!: Date;

  @Field()
  @Type(() => Date)
  @IsDate()
  dateTo!: Date;

  @Field(() => AdminReportGrouping, { nullable: true })
  @IsOptional()
  @IsEnum(AdminReportGrouping)
  grouping?: AdminReportGrouping;

  @Field(() => RemittanceStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RemittanceStatus)
  status?: RemittanceStatus;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  paymentMethodCode?: string;

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

  @Field(() => Int, { nullable: true, defaultValue: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topPaymentMethodsLimit?: number;
}

@InputType()
export class AdminReportExportsInput {
  @Field(() => AdminReportExportDataset, { nullable: true })
  @IsOptional()
  @IsEnum(AdminReportExportDataset)
  dataset?: AdminReportExportDataset;

  @Field(() => AdminReportExportFormat, { nullable: true })
  @IsOptional()
  @IsEnum(AdminReportExportFormat)
  format?: AdminReportExportFormat;

  @Field(() => AdminReportExportStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AdminReportExportStatus)
  status?: AdminReportExportStatus;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}
