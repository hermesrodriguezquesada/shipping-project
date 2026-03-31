import {
  ExternalPaymentProvider,
  ExternalPaymentStatus,
  OriginAccountHolderType,
  PaymentMethodType,
  Prisma,
  ReceptionMethod,
  ReceptionPayoutMethod,
  RemittanceStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { PrismaBeneficiaryCommandAdapter } from 'src/modules/beneficiaries/infrastructure/adapters/prisma-beneficiary-command.adapter';
import { PrismaBeneficiaryQueryAdapter } from 'src/modules/beneficiaries/infrastructure/adapters/prisma-beneficiary-query.adapter';
import { PrismaCatalogsQueryAdapter } from 'src/modules/catalogs/infrastructure/adapters/prisma-catalogs-query.adapter';
import { PrismaCommissionRulesQueryAdapter } from 'src/modules/commission-rules/infrastructure/adapters/prisma-commission-rules-query.adapter';
import { PrismaDeliveryFeesQueryAdapter } from 'src/modules/delivery-fees/infrastructure/adapters/prisma-delivery-fees-query.adapter';
import { PrismaExchangeRatesQueryAdapter } from 'src/modules/exchange-rates/infrastructure/adapters/prisma-exchange-rates-query.adapter';
import { CreateExternalPaymentSessionUseCase } from 'src/modules/remittances/application/use-cases/create-external-payment-session.usecase';
import { ExternalPaymentAcceptanceUseCase } from 'src/modules/remittances/application/use-cases/external-payment-acceptance.usecase';
import { HandleExternalPaymentWebhookUseCase } from 'src/modules/remittances/application/use-cases/handle-external-payment-webhook.usecase';
import { RemittanceLifecycleUseCase } from 'src/modules/remittances/application/use-cases/remittance-lifecycle.usecase';
import { SubmitRemittanceV2UseCase } from 'src/modules/remittances/application/use-cases/submit-remittance-v2.usecase';
import {
  CanonicalExternalPaymentWebhookEvent,
  CreatePaymentSessionProviderInput,
  CreatePaymentSessionProviderResult,
  ExternalPaymentProviderPort,
  ParseAndVerifyWebhookInput,
} from 'src/modules/remittances/domain/ports/external-payment-provider.port';
import { CurrencyAvailabilityBridgeAdapter } from 'src/modules/remittances/infrastructure/adapters/currency-availability.bridge.adapter';
import { PaymentMethodAvailabilityBridgeAdapter } from 'src/modules/remittances/infrastructure/adapters/payment-method-availability.bridge.adapter';
import { PrismaExternalPaymentAdapter } from 'src/modules/remittances/infrastructure/adapters/prisma-external-payment.adapter';
import { PrismaRemittanceCommandAdapter } from 'src/modules/remittances/infrastructure/adapters/prisma-remittance-command.adapter';
import { PrismaRemittanceQueryAdapter } from 'src/modules/remittances/infrastructure/adapters/prisma-remittance-query.adapter';
import { ReceptionMethodAvailabilityBridgeAdapter } from 'src/modules/remittances/infrastructure/adapters/reception-method-availability.bridge.adapter';
import { ExternalPaymentWebhookController } from 'src/modules/remittances/presentation/http/controllers/external-payment-webhook.controller';
import { PricingCalculatorService } from 'src/modules/pricing/application/services/pricing-calculator.service';

class FakeExternalProvider implements ExternalPaymentProviderPort {
  private sessionCounter = 0;

  async createPaymentSession(input: CreatePaymentSessionProviderInput): Promise<CreatePaymentSessionProviderResult> {
    this.sessionCounter += 1;
    return {
      provider: input.provider,
      providerPaymentId: `pi_${input.remittanceId.slice(0, 8)}_${this.sessionCounter}`,
      providerSessionId: `cs_${input.remittanceId.slice(0, 8)}_${this.sessionCounter}`,
      checkoutUrl: `https://checkout.local/${input.remittanceId}/${this.sessionCounter}`,
      status: ExternalPaymentStatus.PENDING,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      metadataJson: {
        source: 'fake-smoke-provider',
      } as Prisma.InputJsonValue,
    };
  }

  async parseAndVerifyWebhook(input: ParseAndVerifyWebhookInput): Promise<CanonicalExternalPaymentWebhookEvent> {
    const body = (input.body ?? {}) as Record<string, unknown>;

    const statusValue = typeof body.status === 'string' ? body.status : 'PENDING';
    const status = statusValue as ExternalPaymentStatus;

    return {
      provider: ExternalPaymentProvider.STRIPE,
      providerEventId: typeof body.providerEventId === 'string' ? body.providerEventId : null,
      providerPaymentId: typeof body.providerPaymentId === 'string' ? body.providerPaymentId : null,
      type: typeof body.type === 'string' ? body.type : 'external.payment.updated',
      status,
      occurredAt: new Date(),
      metadata: {
        simulated: true,
      },
      isTerminal: status === ExternalPaymentStatus.SUCCEEDED
        || status === ExternalPaymentStatus.FAILED
        || status === ExternalPaymentStatus.CANCELED
        || status === ExternalPaymentStatus.EXPIRED,
      rawPayload: body,
    };
  }
}

class FakeNotifier {
  public readonly events: Array<Record<string, unknown>> = [];

  async notifyStatusChange(input: Record<string, unknown>): Promise<void> {
    this.events.push(input);
  }
}

const fakeConfig = {
  remittanceAmountMin: 1,
  remittanceAmountMax: 10000,
};

async function main() {
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const runId = `smoke_${Date.now()}`;
  const externalUserEmail = `${runId}_external@example.com`;
  const manualUserEmail = `${runId}_manual@example.com`;

  const catalogsQuery = new PrismaCatalogsQueryAdapter(prisma);
  const paymentMethodAvailability = new PaymentMethodAvailabilityBridgeAdapter(catalogsQuery);
  const receptionMethodAvailability = new ReceptionMethodAvailabilityBridgeAdapter(catalogsQuery);
  const currencyAvailability = new CurrencyAvailabilityBridgeAdapter(catalogsQuery);

  const remittanceQuery = new PrismaRemittanceQueryAdapter(prisma);
  const remittanceCommand = new PrismaRemittanceCommandAdapter(prisma);
  const externalPaymentAdapter = new PrismaExternalPaymentAdapter(prisma);

  const beneficiaryCommand = new PrismaBeneficiaryCommandAdapter(prisma);
  const beneficiaryQuery = new PrismaBeneficiaryQueryAdapter(prisma);

  const commissionQuery = new PrismaCommissionRulesQueryAdapter(prisma);
  const deliveryFeesQuery = new PrismaDeliveryFeesQueryAdapter(prisma);
  const exchangeRatesQuery = new PrismaExchangeRatesQueryAdapter(prisma);

  const pricingCalculator = new PricingCalculatorService(
    commissionQuery,
    deliveryFeesQuery,
    exchangeRatesQuery,
  );

  const submitUseCase = new SubmitRemittanceV2UseCase(
    beneficiaryCommand,
    beneficiaryQuery,
    remittanceQuery,
    remittanceCommand,
    paymentMethodAvailability,
    receptionMethodAvailability,
    currencyAvailability,
    pricingCalculator,
    fakeConfig as any,
  );

  const fakeProvider = new FakeExternalProvider();
  const createSessionUseCase = new CreateExternalPaymentSessionUseCase(
    remittanceQuery,
    externalPaymentAdapter,
    externalPaymentAdapter,
    fakeProvider,
  );

  const fakeNotifier = new FakeNotifier();
  const acceptanceUseCase = new ExternalPaymentAcceptanceUseCase(
    remittanceQuery,
    remittanceCommand,
    fakeNotifier as any,
  );

  const handleWebhookUseCase = new HandleExternalPaymentWebhookUseCase(
    fakeProvider,
    externalPaymentAdapter,
    externalPaymentAdapter,
    acceptanceUseCase,
  );

  const webhookController = new ExternalPaymentWebhookController(handleWebhookUseCase);

  const setup = await ensureBaseData(prisma);

  const externalUser = await prisma.user.create({
    data: {
      email: externalUserEmail,
      passwordHash: 'smoke-hash',
      roles: [Role.CLIENT],
      firstName: 'Smoke',
      lastName: 'External',
      totalGeneratedAmount: new Prisma.Decimal(0),
    },
  });

  const manualUser = await prisma.user.create({
    data: {
      email: manualUserEmail,
      passwordHash: 'smoke-hash',
      roles: [Role.CLIENT],
      firstName: 'Smoke',
      lastName: 'Manual',
      totalGeneratedAmount: new Prisma.Decimal(0),
    },
  });

  const externalBeneficiary = await prisma.beneficiary.create({
    data: {
      ownerUserId: externalUser.id,
      fullName: 'Beneficiary External',
      phone: '+5355510101',
      country: 'CU',
      addressLine1: 'Calle 1',
      documentNumber: `DOC-${runId}-EXT`,
      isVisibleToOwner: true,
      relationship: 'OTHER',
    },
  });

  const manualBeneficiary = await prisma.beneficiary.create({
    data: {
      ownerUserId: manualUser.id,
      fullName: 'Beneficiary Manual',
      phone: '+5355510202',
      country: 'CU',
      addressLine1: 'Calle 2',
      documentNumber: `DOC-${runId}-MAN`,
      isVisibleToOwner: true,
      relationship: 'OTHER',
    },
  });

  const remittanceExternalA = await submitUseCase.execute({
    senderUserId: externalUser.id,
    beneficiaryId: externalBeneficiary.id,
    paymentAmount: '100',
    paymentCurrencyCode: 'USD',
    receivingCurrencyCode: 'CUP',
    receptionMethod: ReceptionMethod.CUP_CASH,
    originAccountHolder: {
      holderType: OriginAccountHolderType.PERSON,
      firstName: 'Smoke',
      lastName: 'External',
    },
    originAccount: {
      paymentMethodCode: 'STRIPE',
      data: {
        accountRef: `acct-${runId}-ext-a`,
      },
    },
    deliveryLocation: {
      country: 'CU',
      city: 'La Habana',
      region: 'Plaza',
    },
  });

  const beforeExternalUser = await prisma.user.findUniqueOrThrow({
    where: { id: externalUser.id },
    select: { totalGeneratedAmount: true },
  });

  const a1 = await createSessionUseCase.execute({
    remittanceId: remittanceExternalA.id,
    senderUserId: externalUser.id,
  });

  const dbExternalPaymentsAfterA1 = await prisma.externalPayment.findMany({
    where: { remittanceId: remittanceExternalA.id },
    orderBy: { createdAt: 'asc' },
  });

  const remittanceAfterA1 = await prisma.remittance.findUniqueOrThrow({
    where: { id: remittanceExternalA.id },
    select: { status: true },
  });

  const a2 = await createSessionUseCase.execute({
    remittanceId: remittanceExternalA.id,
    senderUserId: externalUser.id,
  });

  const dbExternalPaymentsAfterA2 = await prisma.externalPayment.findMany({
    where: { remittanceId: remittanceExternalA.id },
    orderBy: { createdAt: 'asc' },
  });

  const successWebhookBody = {
    providerEventId: `evt_${runId}_success_1`,
    providerPaymentId: a1.provider ? dbExternalPaymentsAfterA1[0].providerPaymentId : null,
    type: 'external.payment.succeeded',
    status: ExternalPaymentStatus.SUCCEEDED,
  };

  const successResponse = await webhookController.handleWebhook(
    'stripe',
    successWebhookBody,
    { 'stripe-signature': 'simulated' },
    { rawBody: Buffer.from(JSON.stringify(successWebhookBody)) } as any,
  );

  const paymentAfterSuccess = await prisma.externalPayment.findUniqueOrThrow({
    where: { id: dbExternalPaymentsAfterA1[0].id },
  });

  const remittanceAfterSuccess = await prisma.remittance.findUniqueOrThrow({
    where: { id: remittanceExternalA.id },
    select: { status: true },
  });

  const afterSuccessExternalUser = await prisma.user.findUniqueOrThrow({
    where: { id: externalUser.id },
    select: { totalGeneratedAmount: true },
  });

  const duplicateResponse = await webhookController.handleWebhook(
    'stripe',
    successWebhookBody,
    { 'stripe-signature': 'simulated' },
    { rawBody: Buffer.from(JSON.stringify(successWebhookBody)) } as any,
  );

  const remittanceAfterDuplicate = await prisma.remittance.findUniqueOrThrow({
    where: { id: remittanceExternalA.id },
    select: { status: true },
  });

  const userAfterDuplicate = await prisma.user.findUniqueOrThrow({
    where: { id: externalUser.id },
    select: { totalGeneratedAmount: true },
  });

  const remittanceExternalB = await submitUseCase.execute({
    senderUserId: externalUser.id,
    beneficiaryId: externalBeneficiary.id,
    paymentAmount: '80',
    paymentCurrencyCode: 'USD',
    receivingCurrencyCode: 'CUP',
    receptionMethod: ReceptionMethod.CUP_CASH,
    originAccountHolder: {
      holderType: OriginAccountHolderType.PERSON,
      firstName: 'Smoke',
      lastName: 'External',
    },
    originAccount: {
      paymentMethodCode: 'STRIPE',
      data: {
        accountRef: `acct-${runId}-ext-b`,
      },
    },
    deliveryLocation: {
      country: 'CU',
      city: 'La Habana',
      region: 'Plaza',
    },
  });

  const bSession = await createSessionUseCase.execute({
    remittanceId: remittanceExternalB.id,
    senderUserId: externalUser.id,
  });

  const bPayment = await prisma.externalPayment.findUniqueOrThrow({
    where: { id: bSession.paymentId },
  });

  const failedWebhookBody = {
    providerEventId: `evt_${runId}_failed_1`,
    providerPaymentId: bPayment.providerPaymentId,
    type: 'external.payment.failed',
    status: ExternalPaymentStatus.FAILED,
  };

  const failedResponse = await webhookController.handleWebhook(
    'stripe',
    failedWebhookBody,
    { 'stripe-signature': 'simulated' },
    { rawBody: Buffer.from(JSON.stringify(failedWebhookBody)) } as any,
  );

  const bPaymentAfterFailed = await prisma.externalPayment.findUniqueOrThrow({
    where: { id: bPayment.id },
  });

  const remittanceBAfterFailed = await prisma.remittance.findUniqueOrThrow({
    where: { id: remittanceExternalB.id },
    select: { status: true, paymentDetails: true },
  });

  const lifecycleUseCase = new RemittanceLifecycleUseCase(
    remittanceQuery,
    remittanceCommand,
    fakeNotifier as any,
  );

  const remittanceManual = await submitUseCase.execute({
    senderUserId: manualUser.id,
    beneficiaryId: manualBeneficiary.id,
    paymentAmount: '60',
    paymentCurrencyCode: 'USD',
    receivingCurrencyCode: 'CUP',
    receptionMethod: ReceptionMethod.CUP_CASH,
    originAccountHolder: {
      holderType: OriginAccountHolderType.PERSON,
      firstName: 'Smoke',
      lastName: 'Manual',
    },
    originAccount: {
      paymentMethodCode: 'STRIPE',
      data: {
        accountRef: `acct-${runId}-manual`,
      },
    },
    deliveryLocation: {
      country: 'CU',
      city: 'La Habana',
      region: 'Plaza',
    },
  });

  const nr2MarkPaid = await lifecycleUseCase.markPaid({
    remittanceId: remittanceManual.id,
    senderUserId: manualUser.id,
    paymentDetails: 'manual report',
  });

  const remittanceAfterMarkPaid = await prisma.remittance.findUniqueOrThrow({
    where: { id: remittanceManual.id },
    select: { status: true },
  });

  const nr3AdminConfirm = await lifecycleUseCase.adminConfirmRemittancePayment(remittanceManual.id);

  const remittanceAfterAdminConfirm = await prisma.remittance.findUniqueOrThrow({
    where: { id: remittanceManual.id },
    select: { status: true },
  });

  const manualUserAfterConfirm = await prisma.user.findUniqueOrThrow({
    where: { id: manualUser.id },
    select: { totalGeneratedAmount: true },
  });

  const summary = {
    runId,
    setup,
    ids: {
      externalUserId: externalUser.id,
      manualUserId: manualUser.id,
      remittanceExternalAId: remittanceExternalA.id,
      remittanceExternalBId: remittanceExternalB.id,
      remittanceManualId: remittanceManual.id,
      externalPaymentAId: dbExternalPaymentsAfterA1[0]?.id,
      externalPaymentBId: bPayment.id,
    },
    sliceA: {
      A1: {
        response: a1,
        remittanceStatusAfter: remittanceAfterA1.status,
        externalPaymentsCount: dbExternalPaymentsAfterA1.length,
      },
      A2: {
        response: a2,
        reusedSamePaymentId: a1.paymentId === a2.paymentId,
        externalPaymentsCount: dbExternalPaymentsAfterA2.length,
      },
    },
    sliceBSuccess: {
      webhookResponse: successResponse,
      externalPaymentStatusAfter: paymentAfterSuccess.status,
      remittanceStatusAfter: remittanceAfterSuccess.status,
      totalGeneratedAmountBefore: beforeExternalUser.totalGeneratedAmount.toString(),
      totalGeneratedAmountAfter: afterSuccessExternalUser.totalGeneratedAmount.toString(),
      increment: afterSuccessExternalUser.totalGeneratedAmount.minus(beforeExternalUser.totalGeneratedAmount).toString(),
    },
    sliceBDuplicate: {
      webhookResponse: duplicateResponse,
      remittanceStatusAfter: remittanceAfterDuplicate.status,
      totalGeneratedAmountAfterDuplicate: userAfterDuplicate.totalGeneratedAmount.toString(),
      incrementAfterDuplicateVsAfterSuccess: userAfterDuplicate.totalGeneratedAmount.minus(afterSuccessExternalUser.totalGeneratedAmount).toString(),
    },
    sliceBFailed: {
      webhookResponse: failedResponse,
      externalPaymentStatusAfter: bPaymentAfterFailed.status,
      remittanceStatusAfter: remittanceBAfterFailed.status,
      remittancePaymentDetailsAfter: remittanceBAfterFailed.paymentDetails,
    },
    nonRegression: {
      NR1_submitRemittanceV2_remittanceId: remittanceManual.id,
      NR2_markRemittancePaid_result: nr2MarkPaid,
      NR2_markRemittancePaid_statusAfter: remittanceAfterMarkPaid.status,
      NR3_adminConfirm_result: nr3AdminConfirm,
      NR3_adminConfirm_statusAfter: remittanceAfterAdminConfirm.status,
      NR3_manualUserTotalGeneratedAmountAfter: manualUserAfterConfirm.totalGeneratedAmount.toString(),
    },
    notifierEventsCount: fakeNotifier.events.length,
  };

  console.log(JSON.stringify(summary, null, 2));

  await prisma.onModuleDestroy();
}

async function ensureBaseData(prisma: PrismaService) {
  const usd = await prisma.currencyCatalog.upsert({
    where: { code: 'USD' },
    update: { enabled: true },
    create: {
      code: 'USD',
      name: 'US Dollar',
      enabled: true,
    },
  });

  const cup = await prisma.currencyCatalog.upsert({
    where: { code: 'CUP' },
    update: { enabled: true },
    create: {
      code: 'CUP',
      name: 'Cuban Peso',
      enabled: true,
    },
  });

  const paymentMetadata = JSON.stringify({
    schemaVersion: 1,
    allowedFields: ['accountRef'],
    requiredFields: ['accountRef'],
    fieldDefinitions: {
      accountRef: {
        type: 'string',
        required: true,
        minLength: 3,
        maxLength: 128,
      },
    },
  });

  await prisma.paymentMethod.upsert({
    where: { code: 'STRIPE' },
    update: {
      enabled: true,
      type: PaymentMethodType.PLATFORM,
      additionalData: paymentMetadata,
      name: 'Stripe Platform',
    },
    create: {
      code: 'STRIPE',
      name: 'Stripe Platform',
      type: PaymentMethodType.PLATFORM,
      enabled: true,
      additionalData: paymentMetadata,
    },
  });

  await prisma.receptionMethodCatalog.upsert({
    where: { code: ReceptionMethod.CUP_CASH },
    update: {
      enabled: true,
      method: ReceptionPayoutMethod.CASH,
      currencyId: cup.id,
      name: 'CUP Cash',
    },
    create: {
      code: ReceptionMethod.CUP_CASH,
      name: 'CUP Cash',
      currencyId: cup.id,
      method: ReceptionPayoutMethod.CASH,
      enabled: true,
    },
  });

  const existingRate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrencyId: usd.id,
      toCurrencyId: cup.id,
      enabled: true,
    },
  });

  if (!existingRate) {
    await prisma.exchangeRate.create({
      data: {
        fromCurrencyId: usd.id,
        toCurrencyId: cup.id,
        rate: new Prisma.Decimal('300'),
        enabled: true,
      },
    });
  }

  const existingCommission = await prisma.commissionRule.findFirst({
    where: {
      currencyId: usd.id,
      holderType: OriginAccountHolderType.PERSON,
      version: 1,
    },
  });

  if (!existingCommission) {
    await prisma.commissionRule.create({
      data: {
        currencyId: usd.id,
        holderType: OriginAccountHolderType.PERSON,
        version: 1,
        thresholdAmount: new Prisma.Decimal('0'),
        percentRate: new Prisma.Decimal('0'),
        flatFee: new Prisma.Decimal('0'),
        enabled: true,
      },
    });
  }

  const existingDeliveryFee = await prisma.deliveryFeeRule.findFirst({
    where: {
      currencyId: usd.id,
      country: 'CU',
      region: null,
      city: null,
      enabled: true,
    },
  });

  if (!existingDeliveryFee) {
    await prisma.deliveryFeeRule.create({
      data: {
        currencyId: usd.id,
        country: 'CU',
        region: null,
        city: null,
        amount: new Prisma.Decimal('1.00'),
        enabled: true,
      },
    });
  }

  return {
    currencies: { usd: usd.id, cup: cup.id },
    paymentMethodCode: 'STRIPE',
    receptionMethodCode: ReceptionMethod.CUP_CASH,
  };
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
