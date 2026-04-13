import { RemittanceStatus } from '@prisma/client';
import { RemittancesResolver } from './remittances.resolver';

describe('RemittancesResolver canonical originAccount output', () => {
  const buildResolver = () => {
    const adminRemittancesUseCase = {
      list: jest.fn(),
      listByUser: jest.fn(),
      getById: jest.fn(),
    };

    const adminExportReportUseCase = { execute: jest.fn() };
    const adminReportExportsUseCase = { execute: jest.fn() };
    const adminDashboardSummaryUseCase = { execute: jest.fn() };
    const adminTransactionsUseCase = { execute: jest.fn() };
    const adminTransactionsPeriodReportUseCase = { execute: jest.fn() };
    const adminTransactionsAmountStatsUseCase = { execute: jest.fn() };
    const adminPaymentMethodUsageMetricsUseCase = { execute: jest.fn() };

    const remittanceLifecycleUseCase = {
      markPaid: jest.fn(),
      cancelMyRemittance: jest.fn(),
      adminConfirmRemittancePayment: jest.fn(),
      adminCancelRemittance: jest.fn(),
      adminMarkRemittanceDelivered: jest.fn(),
    };

    const getMyRemittanceUseCase = { execute: jest.fn() };
    const listMyRemittancesUseCase = { execute: jest.fn() };
    const submitRemittanceV2UseCase = { execute: jest.fn() };
    const createExternalPaymentSessionUseCase = { execute: jest.fn() };
    const requestPaymentProofUploadUseCase = { execute: jest.fn() };
    const getPaymentProofViewUrlUseCase = { execute: jest.fn() };

    const resolver = new RemittancesResolver(
      adminRemittancesUseCase as any,
      adminExportReportUseCase as any,
      adminReportExportsUseCase as any,
      adminDashboardSummaryUseCase as any,
      adminTransactionsUseCase as any,
      adminTransactionsPeriodReportUseCase as any,
      adminTransactionsAmountStatsUseCase as any,
      adminPaymentMethodUsageMetricsUseCase as any,
      remittanceLifecycleUseCase as any,
      getMyRemittanceUseCase as any,
      listMyRemittancesUseCase as any,
      submitRemittanceV2UseCase as any,
      createExternalPaymentSessionUseCase as any,
      requestPaymentProofUploadUseCase as any,
      getPaymentProofViewUrlUseCase as any,
    );

    return { resolver, getMyRemittanceUseCase };
  };

  it('maps canonical originAccount using payment method code and JSON payload', async () => {
    const { resolver, getMyRemittanceUseCase } = buildResolver();

    getMyRemittanceUseCase.execute.mockResolvedValue({
      id: 'r1',
      status: RemittanceStatus.PENDING_PAYMENT,
      recipientFullName: 'Rec',
      recipientPhone: '+5350000000',
      recipientCountry: 'CU',
      recipientAddressLine1: 'Addr',
      recipientDocumentNumber: 'DOC',
      recipientEmail: null,
      recipientCity: null,
      recipientAddressLine2: null,
      recipientPostalCode: null,
      recipientDocumentType: null,
      recipientRelationship: null,
      recipientDeliveryInstructions: null,
      amount: { toString: () => '100' },
      feesBreakdownJson: null,
      netReceivingAmount: null,
      originAccountData: {
        zelleEmail: 'sender@example.com',
      },
      destinationAccountNumber: null,
      originAccountHolderType: null,
      originAccountHolderFirstName: null,
      originAccountHolderLastName: null,
      originAccountHolderCompanyName: null,
      paymentDetails: null,
      paymentProofKey: null,
      paymentProofFileName: null,
      paymentProofMimeType: null,
      paymentProofSizeBytes: null,
      paymentProofUploadedAt: null,
      statusDescription: null,
      exchangeRateIdUsed: null,
      exchangeRateRateUsed: null,
      exchangeRateUsedAt: null,
      paymentMethod: {
        id: 'pm-1',
        code: 'ZELLE',
        name: 'Zelle',
        description: null,
        type: 'PLATFORM',
        additionalData: null,
        enabled: true,
        imgUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      receptionMethodCatalog: null,
      paymentCurrency: null,
      receivingCurrency: null,
      exchangeRateUsed: null,
      latestExternalPayment: null,
      sender: {
        id: 'u1',
        email: 'owner@example.com',
        roles: ['CLIENT'],
        isActive: true,
        isDeleted: false,
        isVip: false,
        totalGeneratedAmount: { toString: () => '0' },
        clientType: 'INDIVIDUAL',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      beneficiary: {
        id: 'b1',
        fullName: 'Ben',
        phone: '+5351111111',
        email: null,
        country: 'CU',
        city: null,
        addressLine1: 'Addr',
        addressLine2: null,
        postalCode: null,
        documentType: null,
        documentNumber: 'DOC',
        relationship: null,
        deliveryInstructions: null,
        isFavorite: false,
        favoriteAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await resolver.myRemittance('r1', { id: 'u1' } as any);

    expect(result?.originAccount).toEqual({
      paymentMethodCode: 'ZELLE',
      data: {
        zelleEmail: 'sender@example.com',
      },
    });
  });
});
