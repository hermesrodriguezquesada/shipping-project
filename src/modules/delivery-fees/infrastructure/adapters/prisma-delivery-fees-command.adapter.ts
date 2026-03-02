import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { DeliveryFeesCommandPort } from '../../domain/ports/delivery-fees-command.port';

@Injectable()
export class PrismaDeliveryFeesCommandAdapter implements DeliveryFeesCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async createRule(input: {
    currencyId: string;
    country: string;
    region?: string | null;
    city?: string | null;
    amount: Prisma.Decimal;
    enabled: boolean;
  }): Promise<string> {
    const created = await this.prisma.deliveryFeeRule.create({
      data: {
        currencyId: input.currencyId,
        country: input.country.trim().toUpperCase(),
        region: input.region?.trim() || null,
        city: input.city?.trim() || null,
        amount: input.amount,
        enabled: input.enabled,
      },
      select: {
        id: true,
      },
    });

    return created.id;
  }

  async updateRule(input: {
    id: string;
    country?: string;
    region?: string | null;
    city?: string | null;
    amount?: Prisma.Decimal;
    enabled?: boolean;
  }): Promise<void> {
    await this.prisma.deliveryFeeRule.update({
      where: {
        id: input.id,
      },
      data: {
        country: input.country?.trim().toUpperCase(),
        region: input.region === undefined ? undefined : input.region?.trim() || null,
        city: input.city === undefined ? undefined : input.city?.trim() || null,
        amount: input.amount,
        enabled: input.enabled,
      },
    });
  }

  async setEnabled(input: { id: string; enabled: boolean }): Promise<void> {
    await this.prisma.deliveryFeeRule.update({
      where: {
        id: input.id,
      },
      data: {
        enabled: input.enabled,
      },
    });
  }
}
