import { ExchangeRateHistoryType, Prisma } from '@prisma/client';
import { AdminCreateVipExchangeRateUseCase } from './admin-create-vip-exchange-rate.usecase';

describe('AdminCreateVipExchangeRateUseCase', () => {
  const buildUseCase = () => {
    const deps = {
      catalogsQuery: {
        findCurrencyByCode: jest.fn(),
      },
      vipExchangeRateQuery: {
        findByCurrencyPair: jest.fn(),
        findById: jest.fn(),
      },
      vipExchangeRateCommand: {
        create: jest.fn(),
      },
      exchangeRateHistoryRecorder: {
        record: jest.fn(),
      },
    };

    const useCase = new AdminCreateVipExchangeRateUseCase(
      deps.catalogsQuery as any,
      deps.vipExchangeRateQuery as any,
      deps.vipExchangeRateCommand as any,
      deps.exchangeRateHistoryRecorder as any,
    );

    return { useCase, deps };
  };

  it('records a VIP history snapshot after create', async () => {
    const { useCase, deps } = buildUseCase();
    deps.catalogsQuery.findCurrencyByCode
      .mockResolvedValueOnce({ id: 'from-1', enabled: true })
      .mockResolvedValueOnce({ id: 'to-1', enabled: true });
    deps.vipExchangeRateQuery.findByCurrencyPair.mockResolvedValue(null);
    deps.vipExchangeRateCommand.create.mockResolvedValue('vip-1');
    deps.vipExchangeRateQuery.findById.mockResolvedValue({
      id: 'vip-1',
      fromCurrencyId: 'from-1',
      toCurrencyId: 'to-1',
      fromCurrency: { code: 'USD' },
      toCurrency: { code: 'EUR' },
      rate: new Prisma.Decimal('1.50'),
      enabled: true,
      createdAt: new Date('2026-04-27T10:00:00.000Z'),
      updatedAt: new Date('2026-04-27T10:00:00.000Z'),
    });

    await useCase.execute({ fromCurrencyCode: 'usd', toCurrencyCode: 'eur', rate: '1.50' });

    expect(deps.exchangeRateHistoryRecorder.record).toHaveBeenCalledWith(
      expect.objectContaining({
        rateType: ExchangeRateHistoryType.VIP,
        sourceRateId: 'vip-1',
      }),
    );
  });

  it('does not fail the main VIP create flow when history recording fails', async () => {
    const { useCase, deps } = buildUseCase();
    deps.catalogsQuery.findCurrencyByCode
      .mockResolvedValueOnce({ id: 'from-1', enabled: true })
      .mockResolvedValueOnce({ id: 'to-1', enabled: true });
    deps.vipExchangeRateQuery.findByCurrencyPair.mockResolvedValue(null);
    deps.vipExchangeRateCommand.create.mockResolvedValue('vip-1');
    deps.vipExchangeRateQuery.findById.mockResolvedValue({
      id: 'vip-1',
      fromCurrencyId: 'from-1',
      toCurrencyId: 'to-1',
      fromCurrency: { code: 'USD' },
      toCurrency: { code: 'EUR' },
      rate: new Prisma.Decimal('1.50'),
      enabled: true,
      createdAt: new Date('2026-04-27T10:00:00.000Z'),
      updatedAt: new Date('2026-04-27T10:00:00.000Z'),
    });
    deps.exchangeRateHistoryRecorder.record.mockRejectedValue(new Error('boom'));

    await expect(
      useCase.execute({ fromCurrencyCode: 'USD', toCurrencyCode: 'EUR', rate: '1.50' }),
    ).resolves.toEqual(expect.objectContaining({ id: 'vip-1' }));
  });
});