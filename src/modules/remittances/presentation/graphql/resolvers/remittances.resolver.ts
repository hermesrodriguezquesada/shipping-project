import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { AdminRemittancesUseCase } from 'src/modules/remittances/application/use-cases/admin-remittances.usecase';
import { AdminDashboardSummaryUseCase } from 'src/modules/remittances/application/use-cases/admin-dashboard-summary.usecase';
import { AdminExportReportUseCase } from 'src/modules/remittances/application/use-cases/admin-export-report.usecase';
import { AdminReportExportsUseCase } from 'src/modules/remittances/application/use-cases/admin-report-exports.usecase';
import { AdminPaymentMethodUsageMetricsUseCase } from 'src/modules/remittances/application/use-cases/admin-payment-method-usage-metrics.usecase';
import { AdminTransactionsAmountStatsUseCase } from 'src/modules/remittances/application/use-cases/admin-transactions-amount-stats.usecase';
import { AdminTransactionsPeriodReportUseCase } from 'src/modules/remittances/application/use-cases/admin-transactions-period-report.usecase';
import { AdminTransactionsUseCase } from 'src/modules/remittances/application/use-cases/admin-transactions.usecase';
import { CreateExternalPaymentSessionUseCase } from 'src/modules/remittances/application/use-cases/create-external-payment-session.usecase';
import { GetMyRemittanceUseCase } from 'src/modules/remittances/application/use-cases/get-my-remittance.usecase';
import { ListMyRemittancesUseCase } from 'src/modules/remittances/application/use-cases/list-my-remittances.usecase';
import { RemittanceLifecycleUseCase } from 'src/modules/remittances/application/use-cases/remittance-lifecycle.usecase';
import { SubmitRemittanceV2UseCase } from 'src/modules/remittances/application/use-cases/submit-remittance-v2.usecase';
import { RemittanceReadModel } from 'src/modules/remittances/domain/ports/remittance-query.port';
import { UserMapper } from 'src/modules/users/presentation/mappers/user.mapper';
import { CreateExternalPaymentSessionInput } from '../inputs/create-external-payment-session.input';
import {
  AdminPaymentMethodUsageInput,
  AdminReportExportsInput,
  AdminReportExportInput,
  AdminReportGrouping,
  AdminDashboardSummaryInput,
  AdminTransactionsAmountStatsInput,
  AdminTransactionsFilterInput,
  AdminTransactionsPeriodReportInput,
} from '../inputs/admin-transactions.input';
import { SubmitRemittanceV2Input } from '../inputs/submit-remittance-v2.input';
import {
  AdminPaymentMethodUsageMetricType,
  AdminReportExportHistoryItemType,
  AdminReportExportPayload,
  AdminDashboardSummaryType,
  AdminTransactionsAmountStatsType,
  AdminTransactionsPeriodBucketType,
  AdminTransactionType,
} from '../types/admin-transactions.type';
import { CreateExternalPaymentSessionPayload } from '../types/create-external-payment-session.payload';
import { RemittanceType } from '../types/remittance.type';
import { Prisma } from '@prisma/client';

@UseGuards(GqlAuthGuard)
@Resolver()
export class RemittancesResolver {
  constructor(
    private readonly adminRemittancesUseCase: AdminRemittancesUseCase,
    private readonly adminExportReportUseCase: AdminExportReportUseCase,
    private readonly adminReportExportsUseCase: AdminReportExportsUseCase,
    private readonly adminDashboardSummaryUseCase: AdminDashboardSummaryUseCase,
    private readonly adminTransactionsUseCase: AdminTransactionsUseCase,
    private readonly adminTransactionsPeriodReportUseCase: AdminTransactionsPeriodReportUseCase,
    private readonly adminTransactionsAmountStatsUseCase: AdminTransactionsAmountStatsUseCase,
    private readonly adminPaymentMethodUsageMetricsUseCase: AdminPaymentMethodUsageMetricsUseCase,
    private readonly remittanceLifecycleUseCase: RemittanceLifecycleUseCase,
    private readonly getMyRemittanceUseCase: GetMyRemittanceUseCase,
    private readonly listMyRemittancesUseCase: ListMyRemittancesUseCase,
    private readonly submitRemittanceV2UseCase: SubmitRemittanceV2UseCase,
    private readonly createExternalPaymentSessionUseCase: CreateExternalPaymentSessionUseCase,
  ) {}

  @Query(() => RemittanceType, { nullable: true })
  async myRemittance(
    @Args('id', { type: () => ID }) remittanceId: string,
    @CurrentUser() user: AuthContextUser,
  ): Promise<RemittanceType | null> {
    const remittance = await this.getMyRemittanceUseCase.execute({
      senderUserId: user.id,
      remittanceId,
    });

    if (!remittance) {
      return null;
    }

    return this.toRemittanceType(remittance);
  }

  @Query(() => [RemittanceType])
  async myRemittances(
    @Args('limit', { type: () => Int, nullable: true }) limit: number | undefined,
    @Args('offset', { type: () => Int, nullable: true }) offset: number | undefined,
    @CurrentUser() user: AuthContextUser,
  ): Promise<RemittanceType[]> {
    const remittances = await this.listMyRemittancesUseCase.execute({
      senderUserId: user.id,
      limit,
      offset,
    });

    return remittances.map((remittance) => this.toRemittanceType(remittance));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [RemittanceType])
  async adminRemittances(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<RemittanceType[]> {
    const remittances = await this.adminRemittancesUseCase.list({ limit, offset });
    return remittances.map((remittance) => this.toRemittanceType(remittance));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [RemittanceType])
  async adminRemittancesByUser(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<RemittanceType[]> {
    const remittances = await this.adminRemittancesUseCase.listByUser({ userId, limit, offset });
    return remittances.map((remittance) => this.toRemittanceType(remittance));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => RemittanceType, { nullable: true })
  async adminRemittance(@Args('id', { type: () => ID }) id: string): Promise<RemittanceType | null> {
    const remittance = await this.adminRemittancesUseCase.getById(id);
    return remittance ? this.toRemittanceType(remittance) : null;
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => AdminReportExportPayload)
  async adminExportReport(
    @Args('input') input: AdminReportExportInput,
    @CurrentUser() user: AuthContextUser,
  ): Promise<AdminReportExportPayload> {
    return this.adminExportReportUseCase.execute({
      requestedByUserId: user.id,
      dataset: input.dataset,
      format: input.format,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      grouping: input.grouping,
      status: input.status,
      userId: input.userId,
      paymentMethodCode: input.paymentMethodCode,
      offset: input.offset,
      limit: input.limit,
      topPaymentMethodsLimit: input.topPaymentMethodsLimit,
    });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [AdminReportExportHistoryItemType])
  async adminReportExports(
    @Args('input', { nullable: true }) input?: AdminReportExportsInput,
  ): Promise<AdminReportExportHistoryItemType[]> {
    return this.adminReportExportsUseCase.execute({
      dataset: input?.dataset,
      format: input?.format,
      status: input?.status,
      limit: input?.limit,
      offset: input?.offset,
    });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => AdminDashboardSummaryType)
  async adminDashboardSummary(
    @Args('input') input: AdminDashboardSummaryInput,
  ): Promise<AdminDashboardSummaryType> {
    const summary = await this.adminDashboardSummaryUseCase.execute({
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      grouping: input.grouping,
      status: input.status,
      userId: input.userId,
      paymentMethodCode: input.paymentMethodCode,
      topPaymentMethodsLimit: input.topPaymentMethodsLimit,
    });

    return {
      kpis: summary.kpis,
      periodTrend: summary.periodTrend,
      topPaymentMethods: summary.topPaymentMethods.map((metric) => this.toAdminPaymentMethodUsageMetricType(metric)),
      period: {
        dateFrom: summary.period.dateFrom,
        dateTo: summary.period.dateTo,
        grouping: summary.period.grouping as AdminReportGrouping,
      },
      timezone: summary.timezone,
    };
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [AdminTransactionType])
  async adminTransactions(
    @Args('input') input: AdminTransactionsFilterInput,
  ): Promise<AdminTransactionType[]> {
    const remittances = await this.adminTransactionsUseCase.execute({
      status: input.status,
      userId: input.userId,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      paymentMethodCode: input.paymentMethodCode,
      limit: input.limit,
      offset: input.offset,
    });

    return remittances.map((remittance) => this.toAdminTransactionType(remittance));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [AdminTransactionsPeriodBucketType])
  async adminTransactionsPeriodReport(
    @Args('input') input: AdminTransactionsPeriodReportInput,
  ): Promise<AdminTransactionsPeriodBucketType[]> {
    return this.adminTransactionsPeriodReportUseCase.execute({
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      grouping: input.grouping,
      status: input.status,
      userId: input.userId,
      paymentMethodCode: input.paymentMethodCode,
    });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => AdminTransactionsAmountStatsType)
  async adminTransactionsAmountStats(
    @Args('input') input: AdminTransactionsAmountStatsInput,
  ): Promise<AdminTransactionsAmountStatsType> {
    const stats = await this.adminTransactionsAmountStatsUseCase.execute({
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      status: input.status,
      userId: input.userId,
      paymentMethodCode: input.paymentMethodCode,
    });

    return {
      totalPaymentAmount: stats.totalPaymentAmount.toString(),
      totalReceivingAmount: stats.totalReceivingAmount.toString(),
      remittanceCount: stats.remittanceCount,
    };
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [AdminPaymentMethodUsageMetricType])
  async adminPaymentMethodUsageMetrics(
    @Args('input') input: AdminPaymentMethodUsageInput,
  ): Promise<AdminPaymentMethodUsageMetricType[]> {
    const metrics = await this.adminPaymentMethodUsageMetricsUseCase.execute({
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      status: input.status,
      userId: input.userId,
      paymentMethodCode: input.paymentMethodCode,
    });

    return metrics.map((metric) => this.toAdminPaymentMethodUsageMetricType(metric));
  }

  @Mutation(() => RemittanceType)
  async submitRemittanceV2(
    @Args('input') input: SubmitRemittanceV2Input,
    @CurrentUser() user: AuthContextUser,
  ): Promise<RemittanceType> {
    const remittance = await this.submitRemittanceV2UseCase.execute({
      senderUserId: user.id,
      beneficiaryId: input.beneficiaryId,
      manualBeneficiary: input.manualBeneficiary,
      saveManualBeneficiary: input.saveManualBeneficiary,
      paymentAmount: input.paymentAmount,
      paymentCurrencyCode: input.paymentCurrencyCode,
      receivingCurrencyCode: input.receivingCurrencyCode,
      receptionMethod: input.receptionMethod,
      destinationAccountNumber: input.destinationAccountNumber,
      originAccountHolder: input.originAccountHolder,
      originAccount: input.originAccount,
      deliveryLocation: input.deliveryLocation,
    });

    return this.toRemittanceType(remittance);
  }

  @Mutation(() => CreateExternalPaymentSessionPayload)
  async createExternalPaymentSession(
    @Args('input') input: CreateExternalPaymentSessionInput,
    @CurrentUser() user: AuthContextUser,
  ): Promise<CreateExternalPaymentSessionPayload> {
    return this.createExternalPaymentSessionUseCase.execute({
      remittanceId: input.remittanceId,
      senderUserId: user.id,
    });
  }

  @Mutation(() => Boolean)
  async markRemittancePaid(
    @Args('remittanceId', { type: () => ID }) remittanceId: string,
    @Args('paymentDetails') paymentDetails: string,
    @CurrentUser() user: AuthContextUser,
  ): Promise<boolean> {
    return this.remittanceLifecycleUseCase.markPaid({
      remittanceId,
      senderUserId: user.id,
      paymentDetails,
    });
  }

  @Mutation(() => Boolean)
  async cancelMyRemittance(
    @Args('remittanceId', { type: () => ID }) remittanceId: string,
    @CurrentUser() user: AuthContextUser,
  ): Promise<boolean> {
    return this.remittanceLifecycleUseCase.cancelMyRemittance({
      remittanceId,
      senderUserId: user.id,
    });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Boolean)
  async adminConfirmRemittancePayment(
    @Args('remittanceId', { type: () => ID }) remittanceId: string,
  ): Promise<boolean> {
    return this.remittanceLifecycleUseCase.adminConfirmRemittancePayment(remittanceId);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Boolean)
  async adminCancelRemittance(
    @Args('remittanceId', { type: () => ID }) remittanceId: string,
    @Args('statusDescription') statusDescription: string,
  ): Promise<boolean> {
    return this.remittanceLifecycleUseCase.adminCancelRemittance({
      remittanceId,
      statusDescription,
    });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Boolean)
  async adminMarkRemittanceDelivered(
    @Args('remittanceId', { type: () => ID }) remittanceId: string,
  ): Promise<boolean> {
    return this.remittanceLifecycleUseCase.adminMarkRemittanceDelivered(remittanceId);
  }


  private toRemittanceType(remittance: RemittanceReadModel): RemittanceType {
    const originAccount = remittance.paymentMethod?.code
      ? {
          paymentMethodCode: remittance.paymentMethod.code,
          data: this.normalizeOriginAccountData(remittance.originAccountData),
        }
      : null;

    const beneficiary = {
      id: remittance.beneficiary.id,
      fullName: remittance.beneficiary.fullName,
      phone: remittance.beneficiary.phone,
      email: remittance.beneficiary.email ?? undefined,
      country: remittance.beneficiary.country,
      city: remittance.beneficiary.city ?? undefined,
      addressLine1: remittance.beneficiary.addressLine1,
      addressLine2: remittance.beneficiary.addressLine2 ?? undefined,
      postalCode: remittance.beneficiary.postalCode ?? undefined,
      documentType: remittance.beneficiary.documentType ?? undefined,
      documentNumber: remittance.beneficiary.documentNumber,
      relationship: remittance.beneficiary.relationship ?? undefined,
      deliveryInstructions: remittance.beneficiary.deliveryInstructions ?? undefined,
      isFavorite: remittance.beneficiary.isFavorite,
      favoriteAt: remittance.beneficiary.favoriteAt ?? undefined,
      createdAt: remittance.beneficiary.createdAt,
      updatedAt: remittance.beneficiary.updatedAt,
    };

    return {
      id: remittance.id,
      status: remittance.status,
      owner: UserMapper.toGraphQL(remittance.sender),
      recipient: this.toRecipient(remittance),
      paymentAmount: remittance.amount.toString(),
      receivingAmount: remittance.netReceivingAmount?.toString() ?? null,
      feesBreakdownJson: remittance.feesBreakdownJson,
      originAccount,
      receptionMethod: remittance.receptionMethodCatalog,
      destinationAccountNumber: remittance.destinationAccountNumber,
      originAccountHolderType: remittance.originAccountHolderType,
      originAccountHolderFirstName: remittance.originAccountHolderFirstName,
      originAccountHolderLastName: remittance.originAccountHolderLastName,
      originAccountHolderCompanyName: remittance.originAccountHolderCompanyName,
      paymentMethod: remittance.paymentMethod,
      paymentCurrency: remittance.paymentCurrency,
      receivingCurrency: remittance.receivingCurrency,
      paymentDetails: remittance.paymentDetails,
      statusDescription: remittance.statusDescription,
      appliedExchangeRate: remittance.exchangeRateRateUsed?.toString() ?? null,
      beneficiary,
      createdAt: remittance.createdAt,
      updatedAt: remittance.updatedAt,
    };
  }

  private toAdminTransactionType(remittance: RemittanceReadModel): AdminTransactionType {
    return {
      id: remittance.id,
      status: remittance.status,
      owner: UserMapper.toGraphQL(remittance.sender),
      beneficiaryId: remittance.beneficiary.id,
      beneficiaryFullName: remittance.beneficiary.fullName,
      recipient: this.toRecipient(remittance),
      paymentMethodCode: remittance.paymentMethod?.code ?? null,
      paymentMethodName: remittance.paymentMethod?.name ?? null,
      paymentCurrencyCode: remittance.paymentCurrency?.code ?? null,
      receivingCurrencyCode: remittance.receivingCurrency?.code ?? null,
      paymentAmount: remittance.amount.toString(),
      receivingAmount: remittance.netReceivingAmount?.toString() ?? null,
      externalPayment: remittance.latestExternalPayment
        ? {
            id: remittance.latestExternalPayment.id,
            provider: remittance.latestExternalPayment.provider,
            status: remittance.latestExternalPayment.status,
            amount: remittance.latestExternalPayment.amount.toString(),
            currencyCode: remittance.latestExternalPayment.currencyCode,
            checkoutUrl: remittance.latestExternalPayment.checkoutUrl,
            createdAt: remittance.latestExternalPayment.createdAt,
            updatedAt: remittance.latestExternalPayment.updatedAt,
          }
        : null,
      createdAt: remittance.createdAt,
      updatedAt: remittance.updatedAt,
    };
  }

  private toRecipient(remittance: RemittanceReadModel) {
    return {
      fullName: remittance.recipientFullName,
      phone: remittance.recipientPhone,
      country: remittance.recipientCountry,
      addressLine1: remittance.recipientAddressLine1,
      documentNumber: remittance.recipientDocumentNumber,
      email: remittance.recipientEmail,
      city: remittance.recipientCity,
      addressLine2: remittance.recipientAddressLine2,
      postalCode: remittance.recipientPostalCode,
      documentType: remittance.recipientDocumentType,
      relationship: remittance.recipientRelationship,
      deliveryInstructions: remittance.recipientDeliveryInstructions,
    };
  }

  private toAdminPaymentMethodUsageMetricType(metric: {
    paymentMethodCode: string | null;
    paymentMethodName: string | null;
    usageCount: number;
    totalPaymentAmount: { toString(): string };
  }): AdminPaymentMethodUsageMetricType {
    return {
      paymentMethodCode: metric.paymentMethodCode,
      paymentMethodName: metric.paymentMethodName,
      usageCount: metric.usageCount,
      totalPaymentAmount: metric.totalPaymentAmount.toString(),
    };
  }

  private normalizeOriginAccountData(data: Prisma.JsonValue | null): Prisma.JsonValue {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {};
    }

    return data;
  }

}
