import { ExchangeRateHistoryType } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { ListPublicExchangeRateHistoryUseCase } from './list-public-exchange-rate-history.usecase';

describe('ListPublicExchangeRateHistoryUseCase', () => {
  it('applies defaults and normalizes public query filters', async () => {
    const query = {
      listPublic: jest.fn().mockResolvedValue([]),
    };
    const useCase = new ListPublicExchangeRateHistoryUseCase(query as any);

    await useCase.execute({
      rateTypes: [ExchangeRateHistoryType.GENERAL],
      fromCurrencyCode: ' usd ',
      toCurrencyCode: ' eur ',
      currencyCode: ' cup ',
    });

    expect(query.listPublic).toHaveBeenCalledWith({
      rateTypes: [ExchangeRateHistoryType.GENERAL],
      fromCurrencyCode: 'USD',
      toCurrencyCode: 'EUR',
      currencyCode: 'CUP',
      dateFrom: undefined,
      dateTo: undefined,
      limit: 20,
      offset: 0,
    });
  });

  it('rejects inverted date ranges', async () => {
    const query = {
      listPublic: jest.fn(),
    };
    const useCase = new ListPublicExchangeRateHistoryUseCase(query as any);

    await expect(
      useCase.execute({
        dateFrom: new Date('2026-04-28T00:00:00.000Z'),
        dateTo: new Date('2026-04-27T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(ValidationDomainException);
  });
});