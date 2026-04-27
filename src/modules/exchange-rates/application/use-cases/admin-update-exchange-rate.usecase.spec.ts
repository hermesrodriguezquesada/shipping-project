import { ExchangeRateHistoryType, Prisma } from '@prisma/client';
import { AdminUpdateExchangeRateUseCase } from './admin-update-exchange-rate.usecase';

describe('AdminUpdateExchangeRateUseCase', () => {
  const buildUseCase = () => {
    const deps = {
      exchangeRatesQuery: {
        findById: jest.fn(),
      },
      exchangeRatesCommand: {
        updateExchangeRate: jest.fn(),
      },
      exchangeRateHistoryRecorder: {
        record: jest.fn(),
      },
    };

    const useCase = new AdminUpdateExchangeRateUseCase(
      deps.exchangeRatesQuery as any,
      deps.exchangeRatesCommand as any,
      deps.exchangeRateHistoryRecorder as any,
    );

    return { useCase, deps };
  };

  it('records history only when the general rate value changes', async () => {
    const { useCase, deps } = buildUseCase();
    deps.exchangeRatesQuery.findById
      .mockResolvedValueOnce({
        id: 'rate-1',
        fromCurrencyId: 'from-1',
        toCurrencyId: 'to-1',
        fromCurrency: { code: 'USD' },
        toCurrency: { code: 'EUR' },
        rate: new Prisma.Decimal('1.00'),
      })
      .mockResolvedValueOnce({
        id: 'rate-1',
        fromCurrencyId: 'from-1',
        toCurrencyId: 'to-1',
        fromCurrency: { code: 'USD' },
        toCurrency: { code: 'EUR' },
        rate: new Prisma.Decimal('1.25'),
      });

    await useCase.execute({ id: 'rate-1', rate: '1.25', enabled: false });

    expect(deps.exchangeRateHistoryRecorder.record).toHaveBeenCalledWith(
      expect.objectContaining({
        rateType: ExchangeRateHistoryType.GENERAL,
        sourceRateId: 'rate-1',
      }),
    );
  });

  it('does not record history when only enabled changes and rate stays equal', async () => {
    const { useCase, deps } = buildUseCase();
    deps.exchangeRatesQuery.findById
      .mockResolvedValueOnce({
        id: 'rate-1',
        fromCurrencyId: 'from-1',
        toCurrencyId: 'to-1',
        fromCurrency: { code: 'USD' },
        toCurrency: { code: 'EUR' },
        rate: new Prisma.Decimal('1.00'),
      })
      .mockResolvedValueOnce({
        id: 'rate-1',
        fromCurrencyId: 'from-1',
        toCurrencyId: 'to-1',
        fromCurrency: { code: 'USD' },
        toCurrency: { code: 'EUR' },
        rate: new Prisma.Decimal('1.00'),
      });

    await useCase.execute({ id: 'rate-1', rate: '1.00', enabled: false });

    expect(deps.exchangeRateHistoryRecorder.record).not.toHaveBeenCalled();
  });
});