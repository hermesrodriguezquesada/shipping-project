import { Injectable } from '@nestjs/common';
import { OriginAccountHolderType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { CommissionRulesCommandPort } from '../../domain/ports/commission-rules-command.port';

@Injectable()
export class PrismaCommissionRulesCommandAdapter implements CommissionRulesCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async createVersion(input: {
    currencyId: string;
    holderType: OriginAccountHolderType;
    thresholdAmount: Prisma.Decimal;
    percentRate: Prisma.Decimal;
    flatFee: Prisma.Decimal;
    enabled: boolean;
  }): Promise<string> {
    const last = await this.prisma.commissionRule.findFirst({
      where: {
        currencyId: input.currencyId,
        holderType: input.holderType,
      },
      select: {
        version: true,
      },
      orderBy: {
        version: 'desc',
      },
    });

    const created = await this.prisma.commissionRule.create({
      data: {
        currencyId: input.currencyId,
        holderType: input.holderType,
        thresholdAmount: input.thresholdAmount,
        percentRate: input.percentRate,
        flatFee: input.flatFee,
        enabled: input.enabled,
        version: (last?.version ?? 0) + 1,
      },
      select: {
        id: true,
      },
    });

    return created.id;
  }

  async setEnabled(input: { id: string; enabled: boolean }): Promise<void> {
    await this.prisma.commissionRule.update({
      where: {
        id: input.id,
      },
      data: {
        enabled: input.enabled,
      },
    });
  }
}
