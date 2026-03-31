import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  AdminReportExportStatus,
  ExternalPaymentProvider,
  ExternalPaymentStatus,
  RemittanceStatus,
} from '@prisma/client';
import { RemittanceRecipientType } from './remittance-recipient.type';
import { UserType } from 'src/modules/users/presentation/graphql/types/user.type';
import {
  AdminReportExportDataset,
  AdminReportExportFormat,
  AdminReportGrouping,
} from '../inputs/admin-transactions.input';

@ObjectType()
export class AdminExternalPaymentSummaryType {
  @Field(() => ID)
  id!: string;

  @Field(() => ExternalPaymentProvider)
  provider!: ExternalPaymentProvider;

  @Field(() => ExternalPaymentStatus)
  status!: ExternalPaymentStatus;

  @Field()
  amount!: string;

  @Field()
  currencyCode!: string;

  @Field(() => String, { nullable: true })
  checkoutUrl?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class AdminTransactionType {
  @Field(() => ID)
  id!: string;

  @Field(() => RemittanceStatus)
  status!: RemittanceStatus;

  @Field(() => UserType)
  owner!: UserType;

  @Field(() => String)
  beneficiaryId!: string;

  @Field(() => String)
  beneficiaryFullName!: string;

  @Field(() => RemittanceRecipientType)
  recipient!: RemittanceRecipientType;

  @Field(() => String, { nullable: true })
  paymentMethodCode?: string | null;

  @Field(() => String, { nullable: true })
  paymentMethodName?: string | null;

  @Field(() => String, { nullable: true })
  paymentCurrencyCode?: string | null;

  @Field(() => String, { nullable: true })
  receivingCurrencyCode?: string | null;

  @Field()
  paymentAmount!: string;

  @Field(() => String, { nullable: true })
  receivingAmount?: string | null;

  @Field(() => AdminExternalPaymentSummaryType, { nullable: true })
  externalPayment?: AdminExternalPaymentSummaryType | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class AdminTransactionsPeriodBucketType {
  @Field()
  periodStart!: Date;

  @Field()
  periodEnd!: Date;

  @Field(() => Int)
  transactionCount!: number;

  @Field()
  timezone!: string;
}

@ObjectType()
export class AdminTransactionsAmountStatsType {
  @Field()
  totalPaymentAmount!: string;

  @Field()
  totalReceivingAmount!: string;

  @Field(() => Int)
  remittanceCount!: number;
}

@ObjectType()
export class AdminPaymentMethodUsageMetricType {
  @Field(() => String, { nullable: true })
  paymentMethodCode?: string | null;

  @Field(() => String, { nullable: true })
  paymentMethodName?: string | null;

  @Field(() => Int)
  usageCount!: number;

  @Field()
  totalPaymentAmount!: string;
}

@ObjectType()
export class AdminDashboardPeriodType {
  @Field()
  dateFrom!: Date;

  @Field()
  dateTo!: Date;

  @Field(() => AdminReportGrouping)
  grouping!: AdminReportGrouping;
}

@ObjectType()
export class AdminDashboardKpisType {
  @Field(() => Int)
  totalTransactions!: number;

  @Field()
  totalPaymentAmount!: string;

  @Field()
  totalReceivingAmount!: string;
}

@ObjectType()
export class AdminDashboardSummaryType {
  @Field(() => AdminDashboardKpisType)
  kpis!: AdminDashboardKpisType;

  @Field(() => [AdminTransactionsPeriodBucketType])
  periodTrend!: AdminTransactionsPeriodBucketType[];

  @Field(() => [AdminPaymentMethodUsageMetricType])
  topPaymentMethods!: AdminPaymentMethodUsageMetricType[];

  @Field(() => AdminDashboardPeriodType)
  period!: AdminDashboardPeriodType;

  @Field()
  timezone!: string;
}

@ObjectType()
export class AdminReportExportPayload {
  @Field(() => ID)
  exportId!: string;

  @Field(() => AdminReportExportDataset)
  dataset!: AdminReportExportDataset;

  @Field(() => AdminReportExportFormat)
  format!: AdminReportExportFormat;

  @Field()
  fileName!: string;

  @Field()
  mimeType!: string;

  @Field()
  contentBase64!: string;

  @Field(() => Int)
  sizeBytes!: number;

  @Field()
  generatedAt!: Date;

  @Field()
  downloadUrl!: string;

  @Field()
  expiresAt!: Date;
}

@ObjectType()
export class AdminReportExportHistoryItemType {
  @Field(() => ID)
  id!: string;

  @Field(() => AdminReportExportDataset)
  dataset!: AdminReportExportDataset;

  @Field(() => AdminReportExportFormat)
  format!: AdminReportExportFormat;

  @Field()
  fileName!: string;

  @Field()
  mimeType!: string;

  @Field(() => Int)
  sizeBytes!: number;

  @Field(() => AdminReportExportStatus)
  status!: AdminReportExportStatus;

  @Field()
  expiresAt!: Date;

  @Field()
  createdAt!: Date;

  @Field(() => String, { nullable: true })
  downloadUrl!: string | null;
}
