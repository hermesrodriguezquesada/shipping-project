import { OriginAccountHolderType, Prisma, ReceptionMethod, ReceptionPayoutMethod } from '@prisma/client';
import { SubmitRemittanceV2UseCase } from './submit-remittance-v2.usecase';

type UseCaseDeps = {
  beneficiaryCommand: { create: jest.Mock };
  beneficiaryQuery: { findById: jest.Mock };
  remittanceQuery: { findMyRemittanceById: jest.Mock };
  remittanceCommand: { createPendingPayment: jest.Mock };
  internalNotificationCommand: { create: jest.Mock };
  userQuery: { findMany: jest.Mock; findById: jest.Mock };
  paymentMethodAvailability: { findEnabledPaymentMethodByCode: jest.Mock };
  receptionMethodAvailability: { findEnabledReceptionMethodByCode: jest.Mock };
  currencyAvailability: { findEnabledCurrencyByCode: jest.Mock };
  pricingCalculator: { calculate: jest.Mock };
  config: { remittanceAmountMin: number; remittanceAmountMax: number };
};

const buildUseCase = () => {
  const deps: UseCaseDeps = {
    beneficiaryCommand: { create: jest.fn() },
    beneficiaryQuery: { findById: jest.fn() },
    remittanceQuery: { findMyRemittanceById: jest.fn() },
    remittanceCommand: { createPendingPayment: jest.fn() },
    internalNotificationCommand: { create: jest.fn() },
    userQuery: { findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }]), findById: jest.fn() },
    paymentMethodAvailability: { findEnabledPaymentMethodByCode: jest.fn() },
    receptionMethodAvailability: { findEnabledReceptionMethodByCode: jest.fn() },
    currencyAvailability: { findEnabledCurrencyByCode: jest.fn() },
    pricingCalculator: { calculate: jest.fn() },
    config: { remittanceAmountMin: 1, remittanceAmountMax: 10000 },
  };

  const useCase = new SubmitRemittanceV2UseCase(
    deps.beneficiaryCommand as any,
    deps.beneficiaryQuery as any,
    deps.remittanceQuery as any,
    deps.remittanceCommand as any,
    deps.internalNotificationCommand as any,
    deps.userQuery as any,
    deps.paymentMethodAvailability as any,
    deps.receptionMethodAvailability as any,
    deps.currencyAvailability as any,
    deps.pricingCalculator as any,
    deps.config as any,
  );

  return { useCase, deps };
};

const setupCommonSuccessMocks = (
  deps: UseCaseDeps,
  input: { paymentMethodCode?: string; receptionMethodType?: ReceptionPayoutMethod; receptionCurrency?: string } = {},
) => {
  const paymentMethodCode = input.paymentMethodCode ?? 'ZELLE';

  deps.beneficiaryQuery.findById.mockResolvedValue({
    id: 'beneficiary-1',
    ownerUserId: 'user-1',
    fullName: 'Beneficiary Test',
    phone: '+53 50000000',
    country: 'CU',
    addressLine1: 'Line 1',
    documentNumber: 'DOC-1',
    isFavorite: false,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  deps.paymentMethodAvailability.findEnabledPaymentMethodByCode.mockResolvedValue({
    id: 'pm-1',
    code: paymentMethodCode,
    enabled: true,
    additionalData: null,
  });

  deps.receptionMethodAvailability.findEnabledReceptionMethodByCode.mockResolvedValue({
    id: 'rm-1',
    code: 'USD_CASH',
    enabled: true,
    currencyCode: input.receptionCurrency ?? 'USD',
    method: input.receptionMethodType ?? ReceptionPayoutMethod.CASH,
  });

  deps.currencyAvailability.findEnabledCurrencyByCode.mockImplementation(async ({ code }: { code: string }) => ({
    id: `cur-${code}`,
    code,
  }));

  deps.pricingCalculator.calculate.mockResolvedValue({
    commissionRuleId: null,
    commissionRuleVersion: null,
    commissionAmount: new Prisma.Decimal('0'),
    deliveryFeeRuleId: null,
    deliveryFeeAmount: new Prisma.Decimal('0'),
    exchangeRateId: 'fx-1',
    exchangeRateValue: new Prisma.Decimal('1'),
    netReceivingAmount: new Prisma.Decimal('100'),
  });

  deps.remittanceCommand.createPendingPayment.mockResolvedValue('remittance-1');
  deps.remittanceQuery.findMyRemittanceById.mockResolvedValue({ id: 'remittance-1' });
  deps.internalNotificationCommand.create.mockResolvedValue(undefined);
};

const baseInput = () => ({
  senderUserId: 'user-1',
  beneficiaryId: 'beneficiary-1',
  paymentAmount: '100',
  paymentCurrencyCode: 'USD',
  receptionMethod: ReceptionMethod.USD_CASH,
  originAccountHolder: {
    holderType: OriginAccountHolderType.PERSON,
    firstName: 'Ana',
    lastName: 'Diaz',
  },
  originAccount: {
    paymentMethodCode: 'ZELLE',
    data: {
      zelleEmail: 'ana@example.com',
    },
  },
  deliveryLocation: {
    country: 'CU',
  },
});

describe('SubmitRemittanceV2UseCase destinationAccountNumber validation', () => {
  it('fails for transfer methods without destinationAccountNumber', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps, { receptionMethodType: ReceptionPayoutMethod.TRANSFER, receptionCurrency: 'CUP' });

    const input = {
      ...baseInput(),
      receptionMethod: ReceptionMethod.CUP_TRANSFER,
      destinationAccountNumber: undefined as string | undefined,
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      'destinationAccountNumber is required for TRANSFER reception methods',
    );
  });

  it('trims and accepts destinationAccountNumber for transfer methods', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps, { receptionMethodType: ReceptionPayoutMethod.TRANSFER, receptionCurrency: 'CUP' });

    const input = {
      ...baseInput(),
      receptionMethod: ReceptionMethod.CUP_TRANSFER,
      destinationAccountNumber: ' 1234567890123456 ',
    };

    await expect(useCase.execute(input)).resolves.toEqual(expect.objectContaining({ id: 'remittance-1' }));

    expect(deps.remittanceCommand.createPendingPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        destinationAccountNumber: '1234567890123456',
      }),
    );
  });
});

describe('SubmitRemittanceV2UseCase manual beneficiary visibility control', () => {
  const manualInput = (saveManualBeneficiary?: boolean) => ({
    senderUserId: 'user-1',
    manualBeneficiary: {
      fullName: 'Manual Beneficiary',
      phone: '+53 50000000',
      country: 'CU',
      city: 'La Habana',
      addressLine1: 'Line 1',
      documentNumber: 'DOC-1',
    },
    saveManualBeneficiary,
    paymentAmount: '100',
    paymentCurrencyCode: 'USD',
    receptionMethod: ReceptionMethod.USD_CASH,
    originAccountHolder: {
      holderType: OriginAccountHolderType.PERSON,
      firstName: 'Ana',
      lastName: 'Diaz',
    },
    originAccount: {
      paymentMethodCode: 'ZELLE',
      data: {
        zelleEmail: 'ana@example.com',
      },
    },
    deliveryLocation: {
      country: 'CU',
    },
  });

  it('sets isVisibleToOwner based on saveManualBeneficiary', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps);

    deps.beneficiaryCommand.create.mockResolvedValue({
      id: 'beneficiary-created-1',
      ownerUserId: 'user-1',
      fullName: 'Manual Beneficiary',
      phone: '+53 50000000',
      country: 'CU',
      addressLine1: 'Line 1',
      documentNumber: 'DOC-1',
      relationship: null,
      deliveryInstructions: null,
      isFavorite: false,
      isVisibleToOwner: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await useCase.execute(manualInput(true));
    expect(deps.beneficiaryCommand.create).toHaveBeenCalledWith(expect.objectContaining({ isVisibleToOwner: true }));

    await useCase.execute(manualInput(false));
    expect(deps.beneficiaryCommand.create).toHaveBeenCalledWith(expect.objectContaining({ isVisibleToOwner: false }));

    await useCase.execute(manualInput(undefined));
    expect(deps.beneficiaryCommand.create).toHaveBeenCalledWith(expect.objectContaining({ isVisibleToOwner: true }));
  });
});

describe('SubmitRemittanceV2UseCase originAccount data pass-through', () => {
  it('accepts ZELLE payload and persists it', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps, { paymentMethodCode: 'ZELLE' });

    await expect(useCase.execute(baseInput())).resolves.toEqual(expect.objectContaining({ id: 'remittance-1' }));

    expect(deps.remittanceCommand.createPendingPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethodCode: 'ZELLE',
        originAccountData: { zelleEmail: 'ana@example.com' },
      }),
    );

    expect(deps.internalNotificationCommand.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        type: 'NEW_REMITTANCE',
        referenceId: 'remittance-1',
      }),
    );
  });

  it('accepts IBAN payload and persists it', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps, { paymentMethodCode: 'IBAN' });

    await expect(
      useCase.execute({
        ...baseInput(),
        originAccount: {
          paymentMethodCode: 'IBAN',
          data: { iban: 'DE89370400440532013000' },
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'remittance-1' }));
  });

  it('accepts STRIPE payload and persists it', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps, { paymentMethodCode: 'STRIPE' });

    await expect(
      useCase.execute({
        ...baseInput(),
        originAccount: {
          paymentMethodCode: 'STRIPE',
          data: { stripePaymentMethodId: 'pm_123' },
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'remittance-1' }));
  });

  it('accepts payment method created from admin without additionalData', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps, { paymentMethodCode: 'ACH' });

    await expect(
      useCase.execute({
        ...baseInput(),
        originAccount: {
          paymentMethodCode: 'ACH',
          data: { routingNumber: '123456789', accountNumber: '0001234567' },
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'remittance-1' }));

    expect(deps.remittanceCommand.createPendingPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethodCode: 'ACH',
        originAccountData: { routingNumber: '123456789', accountNumber: '0001234567' },
      }),
    );
  });
});
