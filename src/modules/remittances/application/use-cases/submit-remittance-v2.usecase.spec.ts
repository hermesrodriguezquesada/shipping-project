import { OriginAccountHolderType, Prisma, ReceptionMethod, ReceptionPayoutMethod } from '@prisma/client';
import { SubmitRemittanceV2UseCase } from './submit-remittance-v2.usecase';

type UseCaseDeps = {
  beneficiaryCommand: { create: jest.Mock };
  beneficiaryQuery: { findById: jest.Mock };
  remittanceQuery: { findMyRemittanceById: jest.Mock };
  remittanceCommand: { createPendingPayment: jest.Mock };
  paymentMethodAvailability: { findEnabledPaymentMethodByCode: jest.Mock };
  receptionMethodAvailability: { findEnabledReceptionMethodByCode: jest.Mock };
  currencyAvailability: { findEnabledCurrencyByCode: jest.Mock };
  pricingCalculator: { calculate: jest.Mock };
  config: { remittanceAmountMin: number; remittanceAmountMax: number };
};

const zelleMetadata = {
  schemaVersion: 1,
  allowedFields: ['zelleEmail'],
  requiredFields: ['zelleEmail'],
  fieldDefinitions: {
    zelleEmail: {
      type: 'string',
      format: 'email',
      required: true,
      minLength: 5,
      maxLength: 254,
    },
  },
};

const ibanMetadata = {
  schemaVersion: 1,
  allowedFields: ['iban'],
  requiredFields: ['iban'],
  fieldDefinitions: {
    iban: {
      type: 'string',
      format: 'iban',
      required: true,
      minLength: 15,
      maxLength: 34,
    },
  },
};

const stripeMetadata = {
  schemaVersion: 1,
  allowedFields: ['stripePaymentMethodId'],
  requiredFields: ['stripePaymentMethodId'],
  fieldDefinitions: {
    stripePaymentMethodId: {
      type: 'string',
      format: 'token',
      required: true,
      minLength: 3,
      maxLength: 255,
    },
  },
};

const buildUseCase = () => {
  const deps: UseCaseDeps = {
    beneficiaryCommand: { create: jest.fn() },
    beneficiaryQuery: { findById: jest.fn() },
    remittanceQuery: { findMyRemittanceById: jest.fn() },
    remittanceCommand: { createPendingPayment: jest.fn() },
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
  input: { paymentMethodCode?: string; metadata?: unknown; receptionMethodType?: ReceptionPayoutMethod; receptionCurrency?: string } = {},
) => {
  const paymentMethodCode = input.paymentMethodCode ?? 'ZELLE';
  const metadata = Object.prototype.hasOwnProperty.call(input, 'metadata') ? input.metadata : zelleMetadata;

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
    additionalData: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
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

describe('SubmitRemittanceV2UseCase canonical origin account model', () => {
  it('accepts canonical ZELLE payload', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps, { paymentMethodCode: 'ZELLE', metadata: zelleMetadata });

    await expect(useCase.execute(baseInput())).resolves.toEqual(expect.objectContaining({ id: 'remittance-1' }));

    expect(deps.remittanceCommand.createPendingPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethodCode: 'ZELLE',
        originAccountData: { zelleEmail: 'ana@example.com' },
      }),
    );
  });

  it('accepts canonical IBAN payload', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps, { paymentMethodCode: 'IBAN', metadata: ibanMetadata });

    await expect(
      useCase.execute({
        ...baseInput(),
        originAccount: {
          paymentMethodCode: 'IBAN',
          data: {
            iban: 'DE89370400440532013000',
          },
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'remittance-1' }));
  });

  it('accepts canonical STRIPE payload', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps, { paymentMethodCode: 'STRIPE', metadata: stripeMetadata });

    await expect(
      useCase.execute({
        ...baseInput(),
        originAccount: {
          paymentMethodCode: 'STRIPE',
          data: {
            stripePaymentMethodId: 'pm_123',
          },
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'remittance-1' }));
  });

  it('fails with explicit error when metadata is missing or invalid', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps, { paymentMethodCode: 'ZELLE', metadata: null });

    await expect(useCase.execute(baseInput())).rejects.toThrow('payment method metadata is invalid for ZELLE');

    setupCommonSuccessMocks(deps, { paymentMethodCode: 'ZELLE', metadata: '{invalid-json' });

    await expect(useCase.execute(baseInput())).rejects.toThrow('payment method metadata is invalid for ZELLE');
  });

  it('fails when data contains fields not allowed by metadata', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps, { paymentMethodCode: 'ZELLE', metadata: zelleMetadata });

    await expect(
      useCase.execute({
        ...baseInput(),
        originAccount: {
          paymentMethodCode: 'ZELLE',
          data: {
            zelleEmail: 'ana@example.com',
            iban: 'DE89370400440532013000',
          },
        },
      }),
    ).rejects.toThrow('originAccount.data.iban is not allowed for ZELLE');
  });

  it('fails when required field is missing', async () => {
    const { useCase, deps } = buildUseCase();
    setupCommonSuccessMocks(deps, { paymentMethodCode: 'IBAN', metadata: ibanMetadata });

    await expect(
      useCase.execute({
        ...baseInput(),
        originAccount: {
          paymentMethodCode: 'IBAN',
          data: {},
        },
      }),
    ).rejects.toThrow('originAccount.data.iban is required for IBAN');
  });

  it('accepts new methods configured only via metadata', async () => {
    const { useCase, deps } = buildUseCase();

    const achMetadata = {
      schemaVersion: 1,
      allowedFields: ['routingNumber', 'accountNumber'],
      requiredFields: ['routingNumber', 'accountNumber'],
      fieldDefinitions: {
        routingNumber: { type: 'string', pattern: '^\\d{9}$', required: true },
        accountNumber: { type: 'string', minLength: 4, maxLength: 17, required: true },
      },
    };

    setupCommonSuccessMocks(deps, { paymentMethodCode: 'ACH', metadata: achMetadata });

    await expect(
      useCase.execute({
        ...baseInput(),
        originAccount: {
          paymentMethodCode: 'ACH',
          data: {
            routingNumber: '123456789',
            accountNumber: '0001234567',
          },
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'remittance-1' }));

    expect(deps.remittanceCommand.createPendingPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethodCode: 'ACH',
        originAccountData: {
          routingNumber: '123456789',
          accountNumber: '0001234567',
        },
      }),
    );
  });
});
