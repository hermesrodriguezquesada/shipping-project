import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { VipExchangeRateCommandPort } from '../../domain/ports/vip-exchange-rate-command.port';

@Injectable()
export class PrismaVipExchangeRateCommandAdapter implements VipExchangeRateCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    fromCurrencyId: string;
    toCurrencyId: string;
    rate: Prisma.Decimal;
    enabled: boolean;
  }): Promise<string> {
    const created = await this.prisma.vipExchangeRate.create({
      data: {
        fromCurrencyId: input.fromCurrencyId,
        toCurrencyId: input.toCurrencyId,
        rate: input.rate,
        enabled: input.enabled,
      },
      select: { id: true },
    });

    return created.id;
  }

  async update(input: { id: string; rate?: Prisma.Decimal; enabled?: boolean }): Promise<void> {
    await this.prisma.vipExchangeRate.update({
      where: { id: input.id },
      data: {
        rate: input.rate,
        enabled: input.enabled,
      },
    });
  }

  async setEnabled(input: { id: string; enabled: boolean }): Promise<void> {
    await this.prisma.vipExchangeRate.update({
      where: { id: input.id },
      data: { enabled: input.enabled },
    });
  }
}