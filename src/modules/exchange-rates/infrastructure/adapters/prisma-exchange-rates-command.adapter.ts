import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { ExchangeRatesCommandPort } from '../../domain/ports/exchange-rates-command.port';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaExchangeRatesCommandAdapter implements ExchangeRatesCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async createExchangeRate(input: {
    fromCurrencyId: string;
    toCurrencyId: string;
    rate: Prisma.Decimal;
    enabled: boolean;
  }): Promise<string> {
    const exchangeRate = await this.prisma.exchangeRate.create({
      data: {
        fromCurrencyId: input.fromCurrencyId,
        toCurrencyId: input.toCurrencyId,
        rate: input.rate,
        enabled: input.enabled,
      },
      select: {
        id: true,
      },
    });

    return exchangeRate.id;
  }

  async updateExchangeRate(input: { id: string; rate: Prisma.Decimal; enabled?: boolean }): Promise<void> {
    await this.prisma.exchangeRate.update({
      where: { id: input.id },
      data: {
        rate: input.rate,
        enabled: input.enabled,
      },
    });
  }

  async deleteExchangeRate(input: { id: string }): Promise<void> {
    await this.prisma.exchangeRate.update({
      where: { id: input.id },
      data: {
        enabled: false,
      },
    });
  }
}
