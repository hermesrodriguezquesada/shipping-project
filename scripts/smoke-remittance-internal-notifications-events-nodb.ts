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
import { MarkNotificationAsReadUseCase } from 'src/modules/internal-notifications/application/use-cases/mark-notification-as-read.usecase';
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

  async markAsRead(input: { id: string; userId: string }): Promise<boolean> {
    const row = this.rows.find((item) => item.id === input.id && item.userId === input.userId);

    if (!row || row.isRead) {
      return false;
    }

    row.isRead = true;
    row.updatedAt = new Date();
    return true;
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

const state = {
  remittanceId: 'rem-1',
  senderUserId: 'user-1',
  adminUserId: 'admin-1',
  remittanceStatus: RemittanceStatus.PENDING_PAYMENT as RemittanceStatus,
  paymentDetails: null as string | null,
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
      fullName: 'Beneficiary Smoke',
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
    if (input.id !== state.remittanceId || input.senderUserId !== state.senderUserId) {
      return null;
    }

    return {
      id: state.remittanceId,
      status: state.remittanceStatus,
    };
  },

  async findByIdAndSenderUser(input: { id: string; senderUserId: string }) {
    if (input.id !== state.remittanceId || input.senderUserId !== state.senderUserId) {
      return null;
    }

    return {
      id: state.remittanceId,
      status: state.remittanceStatus,
      senderEmail: 'owner@example.com',
    };
  },
};

const remittanceCommand = {
  async createPendingPayment() {
    state.remittanceStatus = RemittanceStatus.PENDING_PAYMENT;
    return state.remittanceId;
  },

  async markPaid(input: { id: string; paymentDetails: string }) {
    if (input.id !== state.remittanceId) {
      throw new Error('unexpected remittance id');
    }

    state.remittanceStatus = RemittanceStatus.PENDING_PAYMENT_CONFIRMATION;
    state.paymentDetails = input.paymentDetails;
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

const config = {
  remittanceAmountMin: 1,
  remittanceAmountMax: 10000,
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

async function main(): Promise<void> {
  const notificationsAdapter = new InMemoryInternalNotificationAdapter();

  const userQuery = {
    async findMany() {
      return [{ id: state.adminUserId, roles: ['ADMIN'], isDeleted: false }];
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

  const listMyNotificationsUseCase = new ListMyNotificationsUseCase(notificationsAdapter);
  const markNotificationAsReadUseCase = new MarkNotificationAsReadUseCase(notificationsAdapter);

  const remittance = await submitUseCase.execute({
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

  const notificationsAfterSubmit = await listMyNotificationsUseCase.execute({
    userId: state.adminUserId,
    limit: 20,
  });

  const caseA = notificationsAfterSubmit.find(
    (item) => item.type === InternalNotificationType.NEW_REMITTANCE && item.referenceId === remittance.id,
  );

  if (!caseA) {
    throw new Error('Caso A fallido: submitRemittanceV2 no genero NEW_REMITTANCE para ADMIN');
  }

  const senderNotificationsAfterSubmit = await listMyNotificationsUseCase.execute({
    userId: state.senderUserId,
    limit: 20,
  });

  if (senderNotificationsAfterSubmit.some((item) => item.type === InternalNotificationType.NEW_REMITTANCE)) {
    throw new Error('Caso A fallido: NEW_REMITTANCE se genero para el cliente');
  }

  await lifecycleUseCase.markPaid({
    remittanceId: remittance.id,
    senderUserId: state.senderUserId,
    paymentProofImg:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+Fj8AAAAASUVORK5CYII=',
    accountHolderName: 'Cuenta QA',
  });

  const notificationsAfterMarkPaid = await listMyNotificationsUseCase.execute({
    userId: state.adminUserId,
    limit: 20,
  });

  const caseB = notificationsAfterMarkPaid.find(
    (item) =>
      item.type === InternalNotificationType.REMITTANCE_PENDING_CONFIRMATION_PAYMENT
      && item.referenceId === remittance.id,
  );

  if (!caseB) {
    throw new Error('Caso B fallido: markRemittancePaid no genero REMITTANCE_PENDING_CONFIRMATION_PAYMENT para ADMIN');
  }

  const senderNotificationsAfterMarkPaid = await listMyNotificationsUseCase.execute({
    userId: state.senderUserId,
    limit: 20,
  });

  if (
    senderNotificationsAfterMarkPaid.some(
      (item) => item.type === InternalNotificationType.REMITTANCE_PENDING_CONFIRMATION_PAYMENT,
    )
  ) {
    throw new Error('Caso B fallido: REMITTANCE_PENDING_CONFIRMATION_PAYMENT se genero para el cliente');
  }

  const markReadResult = await markNotificationAsReadUseCase.execute({
    id: caseB.id,
    userId: state.adminUserId,
  });

  const readNotifications = await listMyNotificationsUseCase.execute({
    userId: state.adminUserId,
    isRead: true,
    limit: 20,
  });

  const caseC = readNotifications.find((item) => item.id === caseB.id);

  if (!markReadResult || !caseC?.isRead) {
    throw new Error('Caso C fallido: markNotificationAsRead no dejo isRead=true');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        remittanceId: remittance.id,
        totalNotifications: notificationsAfterMarkPaid.length,
        caseA_newRemittance: true,
        caseB_pendingConfirmation: true,
        caseC_markAsRead: true,
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
