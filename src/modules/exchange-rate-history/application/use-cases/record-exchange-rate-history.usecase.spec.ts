import { ExchangeRateHistoryType, ExchangeRateHistoryVisibility, Prisma } from '@prisma/client';
import { RecordExchangeRateHistoryUseCase } from './record-exchange-rate-history.usecase';

describe('RecordExchangeRateHistoryUseCase', () => {
  it('defaults GENERAL history visibility to PUBLIC and normalizes currency codes', async () => {
    const recorder = {
      record: jest.fn(),
    };
    const useCase = new RecordExchangeRateHistoryUseCase(recorder as any);

    await useCase.record({
      rateType: ExchangeRateHistoryType.GENERAL,
      fromCurrencyCode: ' usd ',
      toCurrencyCode: ' eur ',
      rate: new Prisma.Decimal('1.23'),
    });

    expect(recorder.record).toHaveBeenCalledWith({
      rateType: ExchangeRateHistoryType.GENERAL,
      visibility: ExchangeRateHistoryVisibility.PUBLIC,
      fromCurrencyCode: 'USD',
      toCurrencyCode: 'EUR',
      rate: new Prisma.Decimal('1.23'),
    });
  });

  it('defaults VIP history visibility to PRIVATE', async () => {
    const recorder = {
      record: jest.fn(),
    };
    const useCase = new RecordExchangeRateHistoryUseCase(recorder as any);

    await useCase.record({
      rateType: ExchangeRateHistoryType.VIP,
      fromCurrencyCode: 'USD',
      toCurrencyCode: 'EUR',
      rate: new Prisma.Decimal('1.50'),
    });

    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: ExchangeRateHistoryVisibility.PRIVATE }),
    );
  });
});