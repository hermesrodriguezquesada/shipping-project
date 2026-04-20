import {
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
import { GetRemittancePaymentProofViewUrlUseCase } from 'src/modules/remittances/application/use-cases/get-remittance-payment-proof-view-url.usecase';
import { RemittanceLifecycleUseCase } from 'src/modules/remittances/application/use-cases/remittance-lifecycle.usecase';
import { SubmitRemittanceV2UseCase } from 'src/modules/remittances/application/use-cases/submit-remittance-v2.usecase';
import { extractPaymentProofKeyFromDetails } from 'src/modules/remittances/application/utils/payment-details-proof';
import { RemittancePaymentProofStoragePort } from 'src/modules/remittances/domain/ports/remittance-payment-proof-storage.port';
import { ListMyNotificationsUseCase } from 'src/modules/internal-notifications/application/use-cases/list-my-notifications.usecase';
import { MarkNotificationAsReadUseCase } from 'src/modules/internal-notifications/application/use-cases/mark-notification-as-read.usecase';
import { PrismaInternalNotificationCommandAdapter } from 'src/modules/internal-notifications/infrastructure/adapters/prisma-internal-notification-command.adapter';
import { PrismaInternalNotificationQueryAdapter } from 'src/modules/internal-notifications/infrastructure/adapters/prisma-internal-notification-query.adapter';
import { PrismaUserQueryAdapter } from 'src/modules/users/infrastructure/adapters/prisma-user-query.adapter';
import { CurrencyAvailabilityBridgeAdapter } from 'src/modules/remittances/infrastructure/adapters/currency-availability.bridge.adapter';
import { PaymentMethodAvailabilityBridgeAdapter } from 'src/modules/remittances/infrastructure/adapters/payment-method-availability.bridge.adapter';
import { PrismaRemittanceCommandAdapter } from 'src/modules/remittances/infrastructure/adapters/prisma-remittance-command.adapter';
import { PrismaRemittanceQueryAdapter } from 'src/modules/remittances/infrastructure/adapters/prisma-remittance-query.adapter';
import { ReceptionMethodAvailabilityBridgeAdapter } from 'src/modules/remittances/infrastructure/adapters/reception-method-availability.bridge.adapter';
import { PricingCalculatorService } from 'src/modules/pricing/application/services/pricing-calculator.service';

class InMemoryPaymentProofStorage implements RemittancePaymentProofStoragePort {
  private readonly objects = new Map<string, { mimeType: string; body: Buffer }>();

  async createPresignedUploadUrl(): Promise<string> {
    throw new Error('not used in this smoke');
  }

  async createPresignedViewUrl(input: { key: string; expiresInSeconds: number }): Promise<string> {
    return `https://proof.local/${encodeURIComponent(input.key)}?exp=${input.expiresInSeconds}`;
  }

  async uploadObject(input: { key: string; mimeType: string; body: Buffer }): Promise<void> {
    this.objects.set(input.key, { mimeType: input.mimeType, body: Buffer.from(input.body) });
  }

  async exists(input: { key: string }): Promise<boolean> {
    return this.objects.has(input.key);
  }
}

class FakeNotifier {
  async notifyStatusChange(): Promise<void> {
    return;
  }
}

const fakeConfig = {
  remittanceAmountMin: 1,
  remittanceAmountMax: 10000,
};

const SAMPLE_PAYMENT_PROOF_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+Fj8AAAAASUVORK5CYII=';

async function main() {
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const runId = `smoke_one_call_${Date.now()}`;

  const catalogsQuery = new PrismaCatalogsQueryAdapter(prisma);
  const paymentMethodAvailability = new PaymentMethodAvailabilityBridgeAdapter(catalogsQuery);
  const receptionMethodAvailability = new ReceptionMethodAvailabilityBridgeAdapter(catalogsQuery);
  const currencyAvailability = new CurrencyAvailabilityBridgeAdapter(catalogsQuery);

  const remittanceQuery = new PrismaRemittanceQueryAdapter(prisma);
  const remittanceCommand = new PrismaRemittanceCommandAdapter(prisma);
  const internalNotificationCommand = new PrismaInternalNotificationCommandAdapter(prisma);
  const internalNotificationQuery = new PrismaInternalNotificationQueryAdapter(prisma);

  const beneficiaryCommand = new PrismaBeneficiaryCommandAdapter(prisma);
  const beneficiaryQuery = new PrismaBeneficiaryQueryAdapter(prisma);

  const commissionQuery = new PrismaCommissionRulesQueryAdapter(prisma);
  const deliveryFeesQuery = new PrismaDeliveryFeesQueryAdapter(prisma);
  const exchangeRatesQuery = new PrismaExchangeRatesQueryAdapter(prisma);

  const pricingCalculator = new PricingCalculatorService(commissionQuery, deliveryFeesQuery, exchangeRatesQuery);

  const submitUseCase = new SubmitRemittanceV2UseCase(
    beneficiaryCommand,
    beneficiaryQuery,
    remittanceQuery,
    remittanceCommand,
    internalNotificationCommand,
    new PrismaUserQueryAdapter(prisma),
    paymentMethodAvailability,
    receptionMethodAvailability,
    currencyAvailability,
    pricingCalculator,
    fakeConfig as any,
  );

  const paymentProofStorage = new InMemoryPaymentProofStorage();
  const lifecycleUseCase = new RemittanceLifecycleUseCase(
    remittanceQuery,
    remittanceCommand,
    paymentProofStorage,
    new FakeNotifier() as any,
    internalNotificationCommand,
    new PrismaUserQueryAdapter(prisma),
  );

  const listMyNotificationsUseCase = new ListMyNotificationsUseCase(internalNotificationQuery as any);
  const markNotificationAsReadUseCase = new MarkNotificationAsReadUseCase(internalNotificationCommand as any);

  const getViewUrlUseCase = new GetRemittancePaymentProofViewUrlUseCase(remittanceQuery, paymentProofStorage);

  await ensureBaseData(prisma);

  const user = await prisma.user.create({
    data: {
      email: `${runId}@example.com`,
      passwordHash: 'smoke-hash',
      roles: [Role.CLIENT],
      firstName: 'Smoke',
      lastName: 'OneCall',
      totalGeneratedAmount: new Prisma.Decimal(0),
    },
  });

  const beneficiary = await prisma.beneficiary.create({
    data: {
      ownerUserId: user.id,
      fullName: 'Beneficiary OneCall',
      phone: '+5355512222',
      country: 'CU',
      addressLine1: 'Calle Smoke 3',
      documentNumber: `DOC-${runId}`,
      isVisibleToOwner: true,
      relationship: 'OTHER',
    },
  });

  const remittance = await submitUseCase.execute({
    senderUserId: user.id,
    beneficiaryId: beneficiary.id,
    paymentAmount: '55',
    paymentCurrencyCode: 'USD',
    receivingCurrencyCode: 'CUP',
    receptionMethod: ReceptionMethod.CUP_CASH,
    originAccountHolder: {
      holderType: OriginAccountHolderType.PERSON,
      firstName: 'Smoke',
      lastName: 'OneCall',
    },
    originAccount: {
      paymentMethodCode: 'STRIPE',
      data: {
        accountRef: `acct-${runId}`,
      },
    },
    deliveryLocation: {
      country: 'CU',
      city: 'La Habana',
      region: 'Plaza',
    },
  });

  const notificationsAfterSubmit = await listMyNotificationsUseCase.execute({
    userId: user.id,
    limit: 20,
  });

  const newRemittanceNotification = notificationsAfterSubmit.find(
    (item) => item.type === 'NEW_REMITTANCE' && item.referenceId === remittance.id,
  );

  if (!newRemittanceNotification) {
    throw new Error('Caso A fallido: no aparece notificacion NEW_REMITTANCE luego de submitRemittanceV2');
  }

  const markPaidResult = await lifecycleUseCase.markPaid({
    remittanceId: remittance.id,
    senderUserId: user.id,
    paymentProofImg: SAMPLE_PAYMENT_PROOF_IMG,
    accountHolderName: 'Cuenta Smoke QA',
  });

  const remittanceAfterMarkPaid = await prisma.remittance.findUniqueOrThrow({
    where: { id: remittance.id },
    select: { status: true, paymentDetails: true },
  });

  const paymentProofKey = extractPaymentProofKeyFromDetails(remittanceAfterMarkPaid.paymentDetails);

  const notificationsAfterMarkPaid = await listMyNotificationsUseCase.execute({
    userId: user.id,
    limit: 20,
  });

  const pendingConfirmationNotification = notificationsAfterMarkPaid.find(
    (item) => item.type === 'REMITTANCE_PENDING_CONFIRMATION_PAYMENT' && item.referenceId === remittance.id,
  );

  if (!pendingConfirmationNotification) {
    throw new Error(
      'Caso B fallido: no aparece notificacion REMITTANCE_PENDING_CONFIRMATION_PAYMENT luego de markRemittancePaid',
    );
  }

  const markAsReadResult = await markNotificationAsReadUseCase.execute({
    id: pendingConfirmationNotification.id,
    userId: user.id,
  });

  const notificationsRead = await listMyNotificationsUseCase.execute({
    userId: user.id,
    isRead: true,
    limit: 20,
  });

  const markedNotification = notificationsRead.find((item) => item.id === pendingConfirmationNotification.id);

  if (!markAsReadResult || !markedNotification?.isRead) {
    throw new Error('Caso C fallido: markNotificationAsRead no dejo la notificacion en isRead=true');
  }

  const view = await getViewUrlUseCase.execute({
    remittanceId: remittance.id,
    requesterUserId: user.id,
    requesterRoles: [Role.CLIENT],
  });

  const summary = {
    createRemittance: {
      id: remittance.id,
      status: remittance.status,
    },
    markRemittancePaid: {
      result: markPaidResult,
      statusAfter: remittanceAfterMarkPaid.status,
      movedToPendingPaymentConfirmation:
        remittanceAfterMarkPaid.status === RemittanceStatus.PENDING_PAYMENT_CONFIRMATION,
    },
    internalNotifications: {
      caseA_newRemittanceFound: Boolean(newRemittanceNotification),
      caseB_pendingConfirmationFound: Boolean(pendingConfirmationNotification),
      caseC_markAsReadResult: markAsReadResult,
      caseC_markedIsReadTrue: Boolean(markedNotification?.isRead),
    },
    paymentDetails: {
      raw: remittanceAfterMarkPaid.paymentDetails,
      parsedProofKey: paymentProofKey,
      containsExpectedFields:
        remittanceAfterMarkPaid.paymentDetails?.includes('img_payment_proof') === true
        && remittanceAfterMarkPaid.paymentDetails?.includes('account_holder_name') === true,
    },
    paymentProofViewUrl: {
      viewUrl: view.viewUrl,
      expiresAt: view.expiresAt.toISOString(),
      generated: view.viewUrl.length > 0,
    },
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
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
