import { InternalNotificationType, RemittanceStatus } from '@prisma/client';
import { RemittanceLifecycleUseCase } from './remittance-lifecycle.usecase';

type UseCaseDeps = {
  remittanceQuery: {
    findByIdAndSenderUser: jest.Mock;
    findRemittanceById: jest.Mock;
  };
  remittanceCommand: {
    markPaid: jest.Mock;
    cancelByClient: jest.Mock;
    confirmPayment: jest.Mock;
    cancelByAdmin: jest.Mock;
    markDelivered: jest.Mock;
  };
  paymentProofStorage: {
    uploadObject: jest.Mock;
  };
  remittanceStatusNotifier: {
    notifyStatusChange: jest.Mock;
  };
  internalNotificationCommand: {
    create: jest.Mock;
  };
  userQuery: {
    findMany: jest.Mock;
  };
};

const buildUseCase = () => {
  const deps: UseCaseDeps = {
    remittanceQuery: {
      findByIdAndSenderUser: jest.fn(),
      findRemittanceById: jest.fn(),
    },
    remittanceCommand: {
      markPaid: jest.fn(),
      cancelByClient: jest.fn(),
      confirmPayment: jest.fn(),
      cancelByAdmin: jest.fn(),
      markDelivered: jest.fn(),
    },
    paymentProofStorage: {
      uploadObject: jest.fn(),
    },
    remittanceStatusNotifier: {
      notifyStatusChange: jest.fn(),
    },
    internalNotificationCommand: {
      create: jest.fn().mockResolvedValue(undefined),
    },
    userQuery: {
      findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }, { id: 'admin-2' }]),
    },
  };

  const useCase = new RemittanceLifecycleUseCase(
    deps.remittanceQuery as any,
    deps.remittanceCommand as any,
    deps.paymentProofStorage as any,
    deps.remittanceStatusNotifier as any,
    deps.internalNotificationCommand as any,
    deps.userQuery as any,
  );

  return { useCase, deps };
};

describe('RemittanceLifecycleUseCase internal notifications', () => {
  it('creates REMITTANCE_CANCELLED_BY_USER for admins when client cancels', async () => {
    const { useCase, deps } = buildUseCase();

    deps.remittanceQuery.findByIdAndSenderUser.mockResolvedValue({
      id: 'rem-1',
      status: RemittanceStatus.PENDING_PAYMENT,
      senderEmail: 'client@example.com',
    });

    await expect(
      useCase.cancelMyRemittance({
        remittanceId: 'rem-1',
        senderUserId: 'client-1',
      }),
    ).resolves.toBe(true);

    expect(deps.internalNotificationCommand.create).toHaveBeenCalledWith({
      userId: 'admin-1',
      type: InternalNotificationType.REMITTANCE_CANCELLED_BY_USER,
      referenceId: 'rem-1',
    });
    expect(deps.internalNotificationCommand.create).toHaveBeenCalledWith({
      userId: 'admin-2',
      type: InternalNotificationType.REMITTANCE_CANCELLED_BY_USER,
      referenceId: 'rem-1',
    });
  });

  it('creates REMITTANCE_PAYMENT_ACCEPTED_SENDING_RECEIVER for client on admin payment confirmation', async () => {
    const { useCase, deps } = buildUseCase();

    deps.remittanceQuery.findRemittanceById.mockResolvedValue({
      id: 'rem-2',
      status: RemittanceStatus.PENDING_PAYMENT_CONFIRMATION,
      sender: {
        id: 'client-2',
        email: 'client2@example.com',
      },
    });

    await expect(useCase.adminConfirmRemittancePayment('rem-2')).resolves.toBe(true);

    expect(deps.internalNotificationCommand.create).toHaveBeenCalledWith({
      userId: 'client-2',
      type: InternalNotificationType.REMITTANCE_PAYMENT_ACCEPTED_SENDING_RECEIVER,
      referenceId: 'rem-2',
    });
  });

  it('creates REMITTANCE_COMPLETED for client on admin delivery completion', async () => {
    const { useCase, deps } = buildUseCase();

    deps.remittanceQuery.findRemittanceById.mockResolvedValue({
      id: 'rem-3',
      status: RemittanceStatus.PAID_SENDING_TO_RECEIVER,
      sender: {
        id: 'client-3',
        email: 'client3@example.com',
      },
    });

    await expect(useCase.adminMarkRemittanceDelivered('rem-3')).resolves.toBe(true);

    expect(deps.internalNotificationCommand.create).toHaveBeenCalledWith({
      userId: 'client-3',
      type: InternalNotificationType.REMITTANCE_COMPLETED,
      referenceId: 'rem-3',
    });
  });

  it('creates REMITTANCE_CANCELLED_BY_ADMIN for client on admin cancellation', async () => {
    const { useCase, deps } = buildUseCase();

    deps.remittanceQuery.findRemittanceById.mockResolvedValue({
      id: 'rem-4',
      status: RemittanceStatus.PENDING_PAYMENT_CONFIRMATION,
      sender: {
        id: 'client-4',
        email: 'client4@example.com',
      },
    });

    await expect(
      useCase.adminCancelRemittance({
        remittanceId: 'rem-4',
        statusDescription: 'Cancelled by admin for compliance',
      }),
    ).resolves.toBe(true);

    expect(deps.internalNotificationCommand.create).toHaveBeenCalledWith({
      userId: 'client-4',
      type: InternalNotificationType.REMITTANCE_CANCELLED_BY_ADMIN,
      referenceId: 'rem-4',
    });
  });
});
