import { ExchangeRateHistoryType, Prisma } from '@prisma/client';
import { AdminCreateExchangeRateUseCase } from './admin-create-exchange-rate.usecase';

describe('AdminCreateExchangeRateUseCase', () => {
  const buildUseCase = () => {
    const deps = {
      catalogsQuery: {
        findCurrencyByCode: jest.fn(),
      },
      exchangeRatesQuery: {
        getLatestExchangeRate: jest.fn(),
        findById: jest.fn(),
      },
      exchangeRatesCommand: {
        createExchangeRate: jest.fn(),
      },
      exchangeRateHistoryRecorder: {
        record: jest.fn(),
      },
    };

    const useCase = new AdminCreateExchangeRateUseCase(
      deps.catalogsQuery as any,
      deps.exchangeRatesQuery as any,
      deps.exchangeRatesCommand as any,
      deps.exchangeRateHistoryRecorder as any,
    );

    return { useCase, deps };
  };

  it('records a GENERAL history snapshot after create', async () => {
    const { useCase, deps } = buildUseCase();
    deps.catalogsQuery.findCurrencyByCode
      .mockResolvedValueOnce({ id: 'from-1', enabled: true })
      .mockResolvedValueOnce({ id: 'to-1', enabled: true });
    deps.exchangeRatesQuery.getLatestExchangeRate.mockResolvedValue(null);
    deps.exchangeRatesCommand.createExchangeRate.mockResolvedValue('rate-1');
    deps.exchangeRatesQuery.findById.mockResolvedValue({
      id: 'rate-1',
      fromCurrencyId: 'from-1',
      toCurrencyId: 'to-1',
      fromCurrency: { code: 'USD' },
      toCurrency: { code: 'EUR' },
      rate: new Prisma.Decimal('1.23'),
      enabled: true,
      createdAt: new Date('2026-04-27T10:00:00.000Z'),
      updatedAt: new Date('2026-04-27T10:00:00.000Z'),
    });

    const result = await useCase.execute({ from: 'usd', to: 'eur', rate: '1.23', enabled: true });

    expect(result.id).toBe('rate-1');
    expect(deps.exchangeRateHistoryRecorder.record).toHaveBeenCalledWith({
      rateType: ExchangeRateHistoryType.GENERAL,
      sourceRateId: 'rate-1',
      fromCurrencyId: 'from-1',
      toCurrencyId: 'to-1',
      fromCurrencyCode: 'USD',
      toCurrencyCode: 'EUR',
      rate: new Prisma.Decimal('1.23'),
    });
  });

  it('does not fail the main create flow when history recording fails', async () => {
    const { useCase, deps } = buildUseCase();
    deps.catalogsQuery.findCurrencyByCode
      .mockResolvedValueOnce({ id: 'from-1', enabled: true })
      .mockResolvedValueOnce({ id: 'to-1', enabled: true });
    deps.exchangeRatesQuery.getLatestExchangeRate.mockResolvedValue(null);
    deps.exchangeRatesCommand.createExchangeRate.mockResolvedValue('rate-1');
    deps.exchangeRatesQuery.findById.mockResolvedValue({
      id: 'rate-1',
      fromCurrencyId: 'from-1',
      toCurrencyId: 'to-1',
      fromCurrency: { code: 'USD' },
      toCurrency: { code: 'EUR' },
      rate: new Prisma.Decimal('1.23'),
      enabled: true,
      createdAt: new Date('2026-04-27T10:00:00.000Z'),
      updatedAt: new Date('2026-04-27T10:00:00.000Z'),
    });
    deps.exchangeRateHistoryRecorder.record.mockRejectedValue(new Error('boom'));

    await expect(useCase.execute({ from: 'USD', to: 'EUR', rate: '1.23' })).resolves.toEqual(
      expect.objectContaining({ id: 'rate-1' }),
    );
  });
});