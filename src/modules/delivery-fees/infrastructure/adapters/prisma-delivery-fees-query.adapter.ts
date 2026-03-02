import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { DeliveryFeeRuleReadModel, DeliveryFeesQueryPort } from '../../domain/ports/delivery-fees-query.port';

@Injectable()
export class PrismaDeliveryFeesQueryAdapter implements DeliveryFeesQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findApplicableRule(input: {
    currencyCode: string;
    country: string;
    region?: string | null;
    city?: string | null;
  }): Promise<DeliveryFeeRuleReadModel | null> {
    const country = input.country.trim().toUpperCase();
    const region = input.region?.trim();
    const city = input.city?.trim();

    const cityRule = city
      ? await this.prisma.deliveryFeeRule.findFirst({
          where: {
            enabled: true,
            country,
            region: region || null,
            city,
            currency: { code: input.currencyCode },
          },
          include: {
            currency: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        })
      : null;

    if (cityRule) {
      return cityRule;
    }

    const regionRule = region
      ? await this.prisma.deliveryFeeRule.findFirst({
          where: {
            enabled: true,
            country,
            region,
            city: null,
            currency: { code: input.currencyCode },
          },
          include: {
            currency: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        })
      : null;

    if (regionRule) {
      return regionRule;
    }

    return this.prisma.deliveryFeeRule.findFirst({
      where: {
        enabled: true,
        country,
        region: null,
        city: null,
        currency: { code: input.currencyCode },
      },
      include: {
        currency: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findById(input: { id: string }): Promise<DeliveryFeeRuleReadModel | null> {
    return this.prisma.deliveryFeeRule.findUnique({
      where: {
        id: input.id,
      },
      include: {
        currency: true,
      },
    });
  }

  async listRules(input: { currencyCode?: string; country?: string; enabled?: boolean }): Promise<DeliveryFeeRuleReadModel[]> {
    return this.prisma.deliveryFeeRule.findMany({
      where: {
        currency: input.currencyCode ? { code: input.currencyCode } : undefined,
        country: input.country?.trim().toUpperCase(),
        enabled: input.enabled,
      },
      include: {
        currency: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }
}
