import { ExchangeRateHistoryType, ExchangeRateHistoryVisibility } from '@prisma/client';
import { PrismaExchangeRateHistoryQueryAdapter } from './prisma-exchange-rate-history-query.adapter';

describe('PrismaExchangeRateHistoryQueryAdapter', () => {
  it('enforces PUBLIC visibility, ANY currency semantics, descending order, and pagination', async () => {
    const prisma = {
      exchangeRateHistory: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const adapter = new PrismaExchangeRateHistoryQueryAdapter(prisma as any);

    await adapter.listPublic({
      rateTypes: [ExchangeRateHistoryType.GENERAL],
      currencyCode: 'USD',
      dateFrom: new Date('2026-04-01T00:00:00.000Z'),
      dateTo: new Date('2026-04-30T00:00:00.000Z'),
      limit: 100,
      offset: 5,
    });

    expect(prisma.exchangeRateHistory.findMany).toHaveBeenCalledWith({
      where: {
        visibility: ExchangeRateHistoryVisibility.PUBLIC,
        rateType: { in: [ExchangeRateHistoryType.GENERAL] },
        fromCurrencyCode: undefined,
        toCurrencyCode: undefined,
        OR: [{ fromCurrencyCode: 'USD' }, { toCurrencyCode: 'USD' }],
        createdAt: {
          gte: new Date('2026-04-01T00:00:00.000Z'),
          lte: new Date('2026-04-30T00:00:00.000Z'),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
      skip: 5,
    });
  });
});