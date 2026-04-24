import { Role, VipPaymentProofStatus } from '@prisma/client';
import { UnauthorizedDomainException } from '../../../../core/exceptions/domain/unauthorized.exception';
import { ValidationDomainException } from '../../../../core/exceptions/domain/validation.exception';
import { AdminCancelVipPaymentProofUseCase } from './admin-cancel-vip-payment-proof.usecase';
import { AdminConfirmVipPaymentProofUseCase } from './admin-confirm-vip-payment-proof.usecase';
import { GetVipPaymentProofViewUrlUseCase } from './get-vip-payment-proof-view-url.usecase';

describe('Vip payment proof review and view use cases', () => {
  it('confirms only pending proofs', async () => {
    const query = {
      findById: jest.fn()
        .mockResolvedValueOnce({ id: 'proof-1', status: VipPaymentProofStatus.PENDING_CONFIRMATION })
        .mockResolvedValueOnce({ id: 'proof-1', status: VipPaymentProofStatus.CONFIRMED }),
    };
    const command = {
      confirmPending: jest.fn().mockResolvedValue(true),
    };
    const useCase = new AdminConfirmVipPaymentProofUseCase(query as any, command as any);

    const result = await useCase.execute({ id: 'proof-1', reviewedById: 'admin-1' });

    expect(command.confirmPending).toHaveBeenCalled();
    expect(result.status).toBe(VipPaymentProofStatus.CONFIRMED);
  });

  it('rejects cancel when reason is blank', async () => {
    const query = {
      findById: jest.fn().mockResolvedValue({ id: 'proof-1', status: VipPaymentProofStatus.PENDING_CONFIRMATION }),
    };
    const command = {
      cancelPending: jest.fn(),
    };
    const useCase = new AdminCancelVipPaymentProofUseCase(query as any, command as any);

    await expect(useCase.execute({ id: 'proof-1', reason: '   ', reviewedById: 'admin-1' })).rejects.toBeInstanceOf(
      ValidationDomainException,
    );
  });

  it('allows owner to get signed view url', async () => {
    const query = {
      findById: jest.fn().mockResolvedValue({
        id: 'proof-1',
        userId: 'user-1',
        paymentProofKey: 'vip-payment-proofs/user-1/proof.png',
      }),
    };
    const storage = {
      exists: jest.fn().mockResolvedValue(true),
      createPresignedViewUrl: jest.fn().mockResolvedValue('https://signed-url.example.com'),
    };
    const useCase = new GetVipPaymentProofViewUrlUseCase(query as any, storage as any);

    const result = await useCase.execute({
      id: 'proof-1',
      requesterUserId: 'user-1',
      requesterRoles: [Role.CLIENT],
    });

    expect(result.viewUrl).toBe('https://signed-url.example.com');
  });

  it('rejects a different client viewing another user proof', async () => {
    const query = {
      findById: jest.fn().mockResolvedValue({
        id: 'proof-1',
        userId: 'user-1',
        paymentProofKey: 'vip-payment-proofs/user-1/proof.png',
      }),
    };
    const storage = {
      exists: jest.fn(),
      createPresignedViewUrl: jest.fn(),
    };
    const useCase = new GetVipPaymentProofViewUrlUseCase(query as any, storage as any);

    await expect(
      useCase.execute({
        id: 'proof-1',
        requesterUserId: 'user-2',
        requesterRoles: [Role.CLIENT],
      }),
    ).rejects.toBeInstanceOf(UnauthorizedDomainException);
  });
});