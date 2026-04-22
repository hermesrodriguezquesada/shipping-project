import {
  BeneficiaryRelationship,
  DocumentType,
  InternalNotificationType,
  OriginAccountHolderType,
  Prisma,
  ReceptionMethod,
  ReceptionPayoutMethod,
  RemittanceStatus,
} from '@prisma/client';
import { SubmitRemittanceV2UseCase } from 'src/modules/remittances/application/use-cases/submit-remittance-v2.usecase';
import { RemittanceLifecycleUseCase } from 'src/modules/remittances/application/use-cases/remittance-lifecycle.usecase';
import { ListMyNotificationsUseCase } from 'src/modules/internal-notifications/application/use-cases/list-my-notifications.usecase';
import { InternalNotificationEntity } from 'src/modules/internal-notifications/domain/entities/internal-notification.entity';
import { InternalNotificationCommandPort } from 'src/modules/internal-notifications/domain/ports/internal-notification-command.port';
import { InternalNotificationQueryPort } from 'src/modules/internal-notifications/domain/ports/internal-notification-query.port';

class InMemoryInternalNotificationAdapter implements InternalNotificationCommandPort, InternalNotificationQueryPort {
  private readonly rows: InternalNotificationEntity[] = [];

  async create(input: {
    userId: string;
    type: InternalNotificationType;
    referenceId?: string | null;
  }): Promise<void> {
    this.rows.push({
      id: `notif-${this.rows.length + 1}`,
      userId: input.userId,
      type: input.type,
      referenceId: input.referenceId ?? null,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async markAsRead(): Promise<boolean> {
    return false;
  }

  async listByUser(input: {
    userId: string;
    offset: number;
    limit: number;
    isRead?: boolean;
  }): Promise<InternalNotificationEntity[]> {
    const filtered = this.rows
      .filter((item) => item.userId === input.userId)
      .filter((item) => (input.isRead === undefined ? true : item.isRead === input.isRead))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return filtered.slice(input.offset, input.offset + input.limit);
  }
}

type RemittanceState = {
  id: string;
  status: RemittanceStatus;
  senderUserId: string;
  senderEmail: string;
  paymentDetails: string | null;
};

const state = {
  sequence: 0,
  senderUserId: 'client-1',
  senderEmail: 'client@example.com',
  remittances: new Map<string, RemittanceState>(),
};

const beneficiaryCommand = {
  async create(input: {
    ownerUserId: string;
    fullName: string;
    phone: string;
    email?: string;
    country: string;
    city?: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode?: string;
    documentType?: DocumentType;
    documentNumber: string;
    relationship?: BeneficiaryRelationship;
    deliveryInstructions?: string;
    isVisibleToOwner: boolean;
  }) {
    return {
      id: 'benef-1',
      ownerUserId: input.ownerUserId,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email ?? null,
      country: input.country,
      city: input.city ?? null,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 ?? null,
      postalCode: input.postalCode ?? null,
      documentType: input.documentType ?? null,
      documentNumber: input.documentNumber,
      relationship: input.relationship ?? null,
      deliveryInstructions: input.deliveryInstructions ?? null,
      isFavorite: false,
      isVisibleToOwner: input.isVisibleToOwner,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
};

const beneficiaryQuery = {
  async findById() {
    return {
      id: 'benef-1',
      ownerUserId: state.senderUserId,
      fullName: 'Smoke Beneficiary',
      phone: '+53 50000000',
      email: null,
      country: 'CU',
      city: null,
      addressLine1: 'Address 1',
      addressLine2: null,
      postalCode: null,
      documentType: null,
      documentNumber: 'DOC-1',
      relationship: null,
      deliveryInstructions: null,
      isFavorite: false,
      isVisibleToOwner: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
};

const remittanceQuery = {
  async findMyRemittanceById(input: { id: string; senderUserId: string }) {
    const row = state.remittances.get(input.id);
    if (!row || row.senderUserId !== input.senderUserId) {
      return null;
    }

    return { id: row.id, status: row.status };
  },

  async findByIdAndSenderUser(input: { id: string; senderUserId: string }) {
    const row = state.remittances.get(input.id);
    if (!row || row.senderUserId !== input.senderUserId) {
      return null;
    }

    return {
      id: row.id,
      status: row.status,
      senderEmail: row.senderEmail,
    };
  },

  async findRemittanceById(input: { id: string }) {
    const row = state.remittances.get(input.id);
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      status: row.status,
      sender: {
        id: row.senderUserId,
        email: row.senderEmail,
      },
    };
  },
};

const remittanceCommand = {
  async createPendingPayment(input: { senderUserId: string }) {
    state.sequence += 1;
    const id = `rem-${state.sequence}`;
    state.remittances.set(id, {
      id,
      status: RemittanceStatus.PENDING_PAYMENT,
      senderUserId: input.senderUserId,
      senderEmail: state.senderEmail,
      paymentDetails: null,
    });
    return id;
  },

  async markPaid(input: { id: string; paymentDetails: string }) {
    const row = state.remittances.get(input.id);
    if (!row) throw new Error('missing remittance');
    row.status = RemittanceStatus.PENDING_PAYMENT_CONFIRMATION;
    row.paymentDetails = input.paymentDetails;
  },

  async confirmPayment(input: { id: string }) {
    const row = state.remittances.get(input.id);
    if (!row) throw new Error('missing remittance');
    row.status = RemittanceStatus.PAID_SENDING_TO_RECEIVER;
  },

  async markDelivered(input: { id: string }) {
    const row = state.remittances.get(input.id);
    if (!row) throw new Error('missing remittance');
    row.status = RemittanceStatus.SUCCESS;
  },

  async cancelByAdmin(input: { id: string }) {
    const row = state.remittances.get(input.id);
    if (!row) throw new Error('missing remittance');
    row.status = RemittanceStatus.CANCELED_BY_ADMIN;
  },

  async cancelByClient(input: { id: string }) {
    const row = state.remittances.get(input.id);
    if (!row) throw new Error('missing remittance');
    row.status = RemittanceStatus.CANCELED_BY_CLIENT;
  },
};

const paymentMethodAvailability = {
  async findEnabledPaymentMethodByCode() {
    return { id: 'pm-1', code: 'ZELLE', enabled: true, additionalData: null };
  },
};

const receptionMethodAvailability = {
  async findEnabledReceptionMethodByCode() {
    return {
      id: 'rm-1',
      code: 'USD_CASH',
      enabled: true,
      currencyCode: 'USD',
      method: ReceptionPayoutMethod.CASH,
    };
  },
};

const currencyAvailability = {
  async findEnabledCurrencyByCode(input: { code: string }) {
    return { id: `cur-${input.code}`, code: input.code };
  },
};

const pricingCalculator = {
  async calculate() {
    return {
      commissionRuleId: null,
      commissionRuleVersion: null,
      commissionAmount: new Prisma.Decimal('0'),
      deliveryFeeRuleId: null,
      deliveryFeeAmount: new Prisma.Decimal('0'),
      exchangeRateId: 'fx-1',
      exchangeRateValue: new Prisma.Decimal('1'),
      netReceivingAmount: new Prisma.Decimal('100'),
    };
  },
};

const paymentProofStorage = {
  async uploadObject() {
    return;
  },
};

const remittanceStatusNotifier = {
  async notifyStatusChange() {
    return;
  },
};

const config = {
  remittanceAmountMin: 1,
  remittanceAmountMax: 10000,
};

function assertContains(
  rows: { type: InternalNotificationType; referenceId: string | null }[],
  type: InternalNotificationType,
  referenceId: string,
  errorMessage: string,
): void {
  const found = rows.some((item) => item.type === type && item.referenceId === referenceId);
  if (!found) {
    throw new Error(errorMessage);
  }
}

async function main(): Promise<void> {
  const notificationsAdapter = new InMemoryInternalNotificationAdapter();

  const userQuery = {
    async findMany() {
      return [{ id: 'admin-1' }, { id: 'admin-2' }];
    },
    async findById() {
      return null;
    },
  };

  const submitUseCase = new SubmitRemittanceV2UseCase(
    beneficiaryCommand as any,
    beneficiaryQuery as any,
    remittanceQuery as any,
    remittanceCommand as any,
    notificationsAdapter,
    userQuery as any,
    paymentMethodAvailability as any,
    receptionMethodAvailability as any,
    currencyAvailability as any,
    pricingCalculator as any,
    config as any,
  );

  const lifecycleUseCase = new RemittanceLifecycleUseCase(
    remittanceQuery as any,
    remittanceCommand as any,
    paymentProofStorage as any,
    remittanceStatusNotifier as any,
    notificationsAdapter,
    userQuery as any,
  );

  const listMyNotifications = new ListMyNotificationsUseCase(notificationsAdapter);

  const remA = await submitUseCase.execute({
    senderUserId: state.senderUserId,
    beneficiaryId: 'benef-1',
    paymentAmount: '100',
    paymentCurrencyCode: 'USD',
    receptionMethod: ReceptionMethod.USD_CASH,
    originAccountHolder: {
      holderType: OriginAccountHolderType.PERSON,
      firstName: 'Smoke',
      lastName: 'User',
    },
    originAccount: {
      paymentMethodCode: 'ZELLE',
      data: { zelleEmail: 'smoke@example.com' },
    },
    deliveryLocation: { country: 'CU' },
  });

  const admin1AfterCreate = await listMyNotifications.execute({ userId: 'admin-1', limit: 100 });
  const clientAfterCreate = await listMyNotifications.execute({ userId: state.senderUserId, limit: 100 });

  assertContains(
    admin1AfterCreate,
    InternalNotificationType.NEW_REMITTANCE,
    remA.id,
    'Caso A fallido: falta NEW_REMITTANCE para ADMIN',
  );
  assertContains(
    clientAfterCreate,
    InternalNotificationType.REMITTANCE_PENDING_PAYMENT,
    remA.id,
    'Caso A fallido: falta REMITTANCE_PENDING_PAYMENT para cliente',
  );

  await lifecycleUseCase.markPaid({
    remittanceId: remA.id,
    senderUserId: state.senderUserId,
    paymentProofImg:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+Fj8AAAAASUVORK5CYII=',
    accountHolderName: 'Cuenta QA',
  });

  await lifecycleUseCase.adminConfirmRemittancePayment(remA.id);

  const clientAfterConfirm = await listMyNotifications.execute({ userId: state.senderUserId, limit: 100 });
  assertContains(
    clientAfterConfirm,
    InternalNotificationType.REMITTANCE_PAYMENT_ACCEPTED_SENDING_RECEIVER,
    remA.id,
    'Caso B fallido: falta REMITTANCE_PAYMENT_ACCEPTED_SENDING_RECEIVER para cliente',
  );

  await lifecycleUseCase.adminMarkRemittanceDelivered(remA.id);

  const clientAfterDelivered = await listMyNotifications.execute({ userId: state.senderUserId, limit: 100 });
  assertContains(
    clientAfterDelivered,
    InternalNotificationType.REMITTANCE_COMPLETED,
    remA.id,
    'Caso C fallido: falta REMITTANCE_COMPLETED para cliente',
  );

  const remD = await submitUseCase.execute({
    senderUserId: state.senderUserId,
    beneficiaryId: 'benef-1',
    paymentAmount: '150',
    paymentCurrencyCode: 'USD',
    receptionMethod: ReceptionMethod.USD_CASH,
    originAccountHolder: {
      holderType: OriginAccountHolderType.PERSON,
      firstName: 'Smoke',
      lastName: 'User',
    },
    originAccount: {
      paymentMethodCode: 'ZELLE',
      data: { zelleEmail: 'smoke@example.com' },
    },
    deliveryLocation: { country: 'CU' },
  });

  await lifecycleUseCase.markPaid({
    remittanceId: remD.id,
    senderUserId: state.senderUserId,
    paymentProofImg:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+Fj8AAAAASUVORK5CYII=',
    accountHolderName: 'Cuenta QA',
  });

  await lifecycleUseCase.adminCancelRemittance({
    remittanceId: remD.id,
    statusDescription: 'Cancelled by admin for smoke',
  });

  const clientAfterAdminCancel = await listMyNotifications.execute({ userId: state.senderUserId, limit: 100 });
  assertContains(
    clientAfterAdminCancel,
    InternalNotificationType.REMITTANCE_CANCELLED_BY_ADMIN,
    remD.id,
    'Caso D fallido: falta REMITTANCE_CANCELLED_BY_ADMIN para cliente',
  );

  const remE = await submitUseCase.execute({
    senderUserId: state.senderUserId,
    beneficiaryId: 'benef-1',
    paymentAmount: '200',
    paymentCurrencyCode: 'USD',
    receptionMethod: ReceptionMethod.USD_CASH,
    originAccountHolder: {
      holderType: OriginAccountHolderType.PERSON,
      firstName: 'Smoke',
      lastName: 'User',
    },
    originAccount: {
      paymentMethodCode: 'ZELLE',
      data: { zelleEmail: 'smoke@example.com' },
    },
    deliveryLocation: { country: 'CU' },
  });

  await lifecycleUseCase.cancelMyRemittance({
    remittanceId: remE.id,
    senderUserId: state.senderUserId,
  });

  const admin1AfterClientCancel = await listMyNotifications.execute({ userId: 'admin-1', limit: 200 });
  const admin2AfterClientCancel = await listMyNotifications.execute({ userId: 'admin-2', limit: 200 });

  assertContains(
    admin1AfterClientCancel,
    InternalNotificationType.REMITTANCE_CANCELLED_BY_USER,
    remE.id,
    'Caso E fallido: falta REMITTANCE_CANCELLED_BY_USER para admin-1',
  );
  assertContains(
    admin2AfterClientCancel,
    InternalNotificationType.REMITTANCE_CANCELLED_BY_USER,
    remE.id,
    'Caso E fallido: falta REMITTANCE_CANCELLED_BY_USER para admin-2',
  );

  const admin1ClientTypes = new Set(admin1AfterClientCancel.map((n) => n.type));
  const clientTypes = new Set(clientAfterAdminCancel.map((n) => n.type));

  if (admin1ClientTypes.has(InternalNotificationType.REMITTANCE_COMPLETED)) {
    throw new Error('Caso F fallido: admin ve notificacion exclusiva de cliente');
  }

  if (clientTypes.has(InternalNotificationType.NEW_REMITTANCE)) {
    throw new Error('Caso F fallido: cliente ve notificacion exclusiva de admin');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        caseA_create: true,
        caseB_confirmPayment: true,
        caseC_completed: true,
        caseD_adminCancel: true,
        caseE_clientCancel: true,
        caseF_visibility: true,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
