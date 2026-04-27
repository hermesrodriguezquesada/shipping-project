import { ExchangeRateHistoryType, Prisma } from '@prisma/client';
import { AdminUpdateVipExchangeRateUseCase } from './admin-update-vip-exchange-rate.usecase';

describe('AdminUpdateVipExchangeRateUseCase', () => {
  const buildUseCase = () => {
    const deps = {
      vipExchangeRateQuery: {
        findById: jest.fn(),
      },
      vipExchangeRateCommand: {
        update: jest.fn(),
      },
      exchangeRateHistoryRecorder: {
        record: jest.fn(),
      },
    };

    const useCase = new AdminUpdateVipExchangeRateUseCase(
      deps.vipExchangeRateQuery as any,
      deps.vipExchangeRateCommand as any,
      deps.exchangeRateHistoryRecorder as any,
    );

    return { useCase, deps };
  };

  it('records history when the VIP rate changes', async () => {
    const { useCase, deps } = buildUseCase();
    deps.vipExchangeRateQuery.findById
      .mockResolvedValueOnce({
        id: 'vip-1',
        fromCurrencyId: 'from-1',
        toCurrencyId: 'to-1',
        fromCurrency: { code: 'USD' },
        toCurrency: { code: 'EUR' },
        rate: new Prisma.Decimal('1.10'),
        enabled: true,
      })
      .mockResolvedValueOnce({
        id: 'vip-1',
        fromCurrencyId: 'from-1',
        toCurrencyId: 'to-1',
        fromCurrency: { code: 'USD' },
        toCurrency: { code: 'EUR' },
        rate: new Prisma.Decimal('1.40'),
        enabled: true,
      });

    await useCase.execute({ id: 'vip-1', rate: '1.40' });

    expect(deps.exchangeRateHistoryRecorder.record).toHaveBeenCalledWith(
      expect.objectContaining({
        rateType: ExchangeRateHistoryType.VIP,
        sourceRateId: 'vip-1',
      }),
    );
  });

  it('does not record history when only enabled changes', async () => {
    const { useCase, deps } = buildUseCase();
    deps.vipExchangeRateQuery.findById
      .mockResolvedValueOnce({
        id: 'vip-1',
        fromCurrencyId: 'from-1',
        toCurrencyId: 'to-1',
        fromCurrency: { code: 'USD' },
        toCurrency: { code: 'EUR' },
        rate: new Prisma.Decimal('1.10'),
        enabled: true,
      })
      .mockResolvedValueOnce({
        id: 'vip-1',
        fromCurrencyId: 'from-1',
        toCurrencyId: 'to-1',
        fromCurrency: { code: 'USD' },
        toCurrency: { code: 'EUR' },
        rate: new Prisma.Decimal('1.10'),
        enabled: false,
      });

    await useCase.execute({ id: 'vip-1', enabled: false });

    expect(deps.exchangeRateHistoryRecorder.record).not.toHaveBeenCalled();
  });

  it('does not record history when the VIP rate value is unchanged', async () => {
    const { useCase, deps } = buildUseCase();
    deps.vipExchangeRateQuery.findById
      .mockResolvedValueOnce({
        id: 'vip-1',
        fromCurrencyId: 'from-1',
        toCurrencyId: 'to-1',
        fromCurrency: { code: 'USD' },
        toCurrency: { code: 'EUR' },
        rate: new Prisma.Decimal('1.10'),
        enabled: true,
      })
      .mockResolvedValueOnce({
        id: 'vip-1',
        fromCurrencyId: 'from-1',
        toCurrencyId: 'to-1',
        fromCurrency: { code: 'USD' },
        toCurrency: { code: 'EUR' },
        rate: new Prisma.Decimal('1.10'),
        enabled: true,
      });

    await useCase.execute({ id: 'vip-1', rate: '1.10' });

    expect(deps.exchangeRateHistoryRecorder.record).not.toHaveBeenCalled();
  });
});