import { Prisma } from '@prisma/client';
import { UnauthorizedDomainException } from '../../../../core/exceptions/domain/unauthorized.exception';
import { ValidationDomainException } from '../../../../core/exceptions/domain/validation.exception';
import { CreateVipPaymentProofUseCase } from './create-vip-payment-proof.usecase';

describe('CreateVipPaymentProofUseCase', () => {
  const buildUseCase = () => {
    const deps = {
      userQuery: {
        findById: jest.fn(),
      },
      catalogsQuery: {
        findCurrencyById: jest.fn(),
      },
      command: {
        create: jest.fn(),
      },
      query: {
        findById: jest.fn(),
      },
      storage: {
        uploadObject: jest.fn(),
      },
    };

    const useCase = new CreateVipPaymentProofUseCase(
      deps.userQuery as any,
      deps.catalogsQuery as any,
      deps.command as any,
      deps.query as any,
      deps.storage as any,
    );

    return { useCase, deps };
  };

  it('rejects non vip users', async () => {
    const { useCase, deps } = buildUseCase();
    deps.userQuery.findById.mockResolvedValue({ id: 'user-1', isVip: false });

    await expect(
      useCase.execute({
        userId: 'user-1',
        accountHolderName: 'John Doe',
        amount: '10',
        currencyId: 'currency-1',
        paymentProofImg: 'data:image/png;base64,aGVsbG8=',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedDomainException);
  });

  it('rejects non positive amounts', async () => {
    const { useCase, deps } = buildUseCase();
    deps.userQuery.findById.mockResolvedValue({ id: 'user-1', isVip: true });

    await expect(
      useCase.execute({
        userId: 'user-1',
        accountHolderName: 'John Doe',
        amount: '0',
        currencyId: 'currency-1',
        paymentProofImg: 'data:image/png;base64,aGVsbG8=',
      }),
    ).rejects.toBeInstanceOf(ValidationDomainException);
  });

  it('creates a pending vip payment proof for a vip user', async () => {
    const { useCase, deps } = buildUseCase();
    deps.userQuery.findById.mockResolvedValue({ id: 'user-1', isVip: true });
    deps.catalogsQuery.findCurrencyById.mockResolvedValue({ id: 'currency-1', enabled: true });
    deps.command.create.mockResolvedValue('proof-1');
    deps.query.findById.mockResolvedValue({
      id: 'proof-1',
      userId: 'user-1',
      accountHolderName: 'John Doe',
      amount: new Prisma.Decimal('10.50'),
      currencyId: 'currency-1',
      paymentProofKey: 'vip-payment-proofs/user-1/proof.png',
      status: 'PENDING_CONFIRMATION',
      createdAt: new Date('2026-04-24T10:00:00.000Z'),
      updatedAt: new Date('2026-04-24T10:00:00.000Z'),
    });

    const result = await useCase.execute({
      userId: 'user-1',
      accountHolderName: ' John Doe ',
      amount: '10.50',
      currencyId: 'currency-1',
      paymentProofImg: 'data:image/png;base64,aGVsbG8=',
    });

    expect(deps.storage.uploadObject).toHaveBeenCalled();
    expect(deps.command.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        accountHolderName: 'John Doe',
        amount: new Prisma.Decimal('10.50'),
        currencyId: 'currency-1',
      }),
    );
    expect(result.id).toBe('proof-1');
  });
});