import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { ExchangeRateQueryPort } from '../../domain/ports/exchange-rate-query.port';

@Injectable()
export class PrismaExchangeRateQueryAdapter extends ExchangeRateQueryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findRate(params: {
    fromCurrencyCode: string;
    toCurrencyCode: string;
  }): Promise<{ rate: string } | null> {
    const row = await this.prisma.exchangeRate.findFirst({
      where: {
        enabled: true,
        fromCurrency: { code: params.fromCurrencyCode },
        toCurrency: { code: params.toCurrencyCode },
      },
      select: {
        rate: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return row ? { rate: row.rate.toString() } : null;
  }
}