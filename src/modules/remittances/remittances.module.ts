import { Module } from '@nestjs/common';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { AppConfigModule } from 'src/core/config/config.module';
import { NotificationsModule } from 'src/core/notifications/notifications.module';
import { BeneficiariesModule } from '../beneficiaries/beneficiaries.module';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';
import { InternalNotificationsModule } from '../internal-notifications/internal-notifications.module';
import { PricingModule } from '../pricing/pricing.module';
import {
  ADMIN_REPORT_EXPORT_HISTORY_PORT,
  ADMIN_REPORT_EXPORT_STORAGE_PORT,
  CURRENCY_AVAILABILITY_PORT,
  EXTERNAL_PAYMENT_COMMAND_PORT,
  EXTERNAL_PAYMENT_PROVIDER_PORT,
  EXTERNAL_PAYMENT_QUERY_PORT,
  PAYMENT_METHOD_AVAILABILITY_PORT,
  RECEPTION_METHOD_AVAILABILITY_PORT,
  REMITTANCE_COMMAND_PORT,
  REMITTANCE_PAYMENT_PROOF_STORAGE_PORT,
  REMITTANCE_QUERY_PORT,
  REMITTANCE_RECEIPT_PDF_GENERATOR_PORT,
  REMITTANCE_STATUS_NOTIFIER_PORT,
} from 'src/shared/constants/tokens';
import { AdminRemittancesUseCase } from './application/use-cases/admin-remittances.usecase';
import { AdminDashboardSummaryUseCase } from './application/use-cases/admin-dashboard-summary.usecase';
import { AdminExportReportUseCase } from './application/use-cases/admin-export-report.usecase';
import { AdminReportExportsUseCase } from './application/use-cases/admin-report-exports.usecase';
import { AdminPaymentMethodUsageMetricsUseCase } from './application/use-cases/admin-payment-method-usage-metrics.usecase';
import { AdminTransactionsAmountStatsUseCase } from './application/use-cases/admin-transactions-amount-stats.usecase';
import { AdminTransactionsPeriodReportUseCase } from './application/use-cases/admin-transactions-period-report.usecase';
import { AdminTransactionsUseCase } from './application/use-cases/admin-transactions.usecase';
import { CreateExternalPaymentSessionUseCase } from './application/use-cases/create-external-payment-session.usecase';
import { DownloadRemittanceReceiptUseCase } from './application/use-cases/download-remittance-receipt.usecase';
import { DownloadAdminReportExportUseCase } from './application/use-cases/download-admin-report-export.usecase';
import { ExternalPaymentAcceptanceUseCase } from './application/use-cases/external-payment-acceptance.usecase';
import { GetRemittancePaymentProofViewUrlUseCase } from './application/use-cases/get-remittance-payment-proof-view-url.usecase';
import { GetMyRemittanceUseCase } from './application/use-cases/get-my-remittance.usecase';
import { HandleExternalPaymentWebhookUseCase } from './application/use-cases/handle-external-payment-webhook.usecase';
import { ListMyRemittancesUseCase } from './application/use-cases/list-my-remittances.usecase';
import { RemittanceLifecycleUseCase } from './application/use-cases/remittance-lifecycle.usecase';
import { SubmitRemittanceV2UseCase } from './application/use-cases/submit-remittance-v2.usecase';
import { CurrencyAvailabilityBridgeAdapter } from './infrastructure/adapters/currency-availability.bridge.adapter';
import { MailerRemittanceStatusNotifierAdapter } from './infrastructure/adapters/mailer-remittance-status-notifier.adapter';
import { LocalAdminReportExportStorageAdapter } from './infrastructure/adapters/local-admin-report-export-storage.adapter';
import { PaymentMethodAvailabilityBridgeAdapter } from './infrastructure/adapters/payment-method-availability.bridge.adapter';
import { PrismaAdminReportExportHistoryAdapter } from './infrastructure/adapters/prisma-admin-report-export-history.adapter';
import { PrismaExternalPaymentAdapter } from './infrastructure/adapters/prisma-external-payment.adapter';
import { PrismaRemittanceCommandAdapter } from './infrastructure/adapters/prisma-remittance-command.adapter';
import { PrismaRemittanceQueryAdapter } from './infrastructure/adapters/prisma-remittance-query.adapter';
import { ReceptionMethodAvailabilityBridgeAdapter } from './infrastructure/adapters/reception-method-availability.bridge.adapter';
import { S3RemittancePaymentProofStorageAdapter } from './infrastructure/adapters/s3-remittance-payment-proof-storage.adapter';
import { SimplePdfReceiptGeneratorAdapter } from './infrastructure/adapters/simple-pdf-receipt-generator.adapter';
import { StripeExternalPaymentProviderAdapter } from './infrastructure/adapters/stripe-external-payment-provider.adapter';
import { ExternalPaymentWebhookController } from './presentation/http/controllers/external-payment-webhook.controller';
import { AdminReportExportController } from './presentation/http/controllers/admin-report-export.controller';
import { RemittanceReceiptController } from './presentation/http/controllers/remittance-receipt.controller';
import { RemittancesResolver } from './presentation/graphql/resolvers/remittances.resolver';

@Module({
  imports: [
    AppConfigModule,
    NotificationsModule,
    InternalNotificationsModule,
    BeneficiariesModule,
    CatalogsModule,
    ExchangeRatesModule,
    PricingModule,
  ],
  controllers: [RemittanceReceiptController, ExternalPaymentWebhookController, AdminReportExportController],
  providers: [
    PrismaRemittanceCommandAdapter,
    PrismaRemittanceQueryAdapter,
    PrismaExternalPaymentAdapter,
    PrismaAdminReportExportHistoryAdapter,
    LocalAdminReportExportStorageAdapter,
    S3RemittancePaymentProofStorageAdapter,
    SimplePdfReceiptGeneratorAdapter,
    { provide: REMITTANCE_COMMAND_PORT, useExisting: PrismaRemittanceCommandAdapter },
    { provide: REMITTANCE_QUERY_PORT, useExisting: PrismaRemittanceQueryAdapter },
    { provide: REMITTANCE_STATUS_NOTIFIER_PORT, useClass: MailerRemittanceStatusNotifierAdapter },
    { provide: REMITTANCE_RECEIPT_PDF_GENERATOR_PORT, useExisting: SimplePdfReceiptGeneratorAdapter },
    { provide: EXTERNAL_PAYMENT_QUERY_PORT, useExisting: PrismaExternalPaymentAdapter },
    { provide: EXTERNAL_PAYMENT_COMMAND_PORT, useExisting: PrismaExternalPaymentAdapter },
    { provide: ADMIN_REPORT_EXPORT_HISTORY_PORT, useExisting: PrismaAdminReportExportHistoryAdapter },
    { provide: ADMIN_REPORT_EXPORT_STORAGE_PORT, useExisting: LocalAdminReportExportStorageAdapter },
    { provide: REMITTANCE_PAYMENT_PROOF_STORAGE_PORT, useExisting: S3RemittancePaymentProofStorageAdapter },
    { provide: EXTERNAL_PAYMENT_PROVIDER_PORT, useClass: StripeExternalPaymentProviderAdapter },
    { provide: PAYMENT_METHOD_AVAILABILITY_PORT, useClass: PaymentMethodAvailabilityBridgeAdapter },
    { provide: RECEPTION_METHOD_AVAILABILITY_PORT, useClass: ReceptionMethodAvailabilityBridgeAdapter },
    { provide: CURRENCY_AVAILABILITY_PORT, useClass: CurrencyAvailabilityBridgeAdapter },
    AdminRemittancesUseCase,
    AdminExportReportUseCase,
    AdminReportExportsUseCase,
    AdminDashboardSummaryUseCase,
    AdminTransactionsUseCase,
    AdminTransactionsPeriodReportUseCase,
    AdminTransactionsAmountStatsUseCase,
    AdminPaymentMethodUsageMetricsUseCase,
    GetRemittancePaymentProofViewUrlUseCase,
    CreateExternalPaymentSessionUseCase,
    DownloadRemittanceReceiptUseCase,
    DownloadAdminReportExportUseCase,
    ExternalPaymentAcceptanceUseCase,
    GetMyRemittanceUseCase,
    HandleExternalPaymentWebhookUseCase,
    ListMyRemittancesUseCase,
    RemittanceLifecycleUseCase,
    SubmitRemittanceV2UseCase,
    RolesGuard,
    RemittancesResolver,
  ],
})
export class RemittancesModule {}
