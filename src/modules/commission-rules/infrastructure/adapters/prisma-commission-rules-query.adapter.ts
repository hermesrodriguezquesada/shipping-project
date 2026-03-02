import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CommissionRuleReadModel, CommissionRulesQueryPort } from '../../domain/ports/commission-rules-query.port';
import { OriginAccountHolderType } from '@prisma/client';

@Injectable()
export class PrismaCommissionRulesQueryAdapter implements CommissionRulesQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findApplicableRule(input: {
    currencyCode: string;
    holderType: OriginAccountHolderType;
  }): Promise<CommissionRuleReadModel | null> {
    return this.prisma.commissionRule.findFirst({
      where: {
        enabled: true,
        holderType: input.holderType,
        currency: {
          code: input.currencyCode,
        },
      },
      include: {
        currency: true,
      },
      orderBy: {
        version: 'desc',
      },
    });
  }

  async findById(input: { id: string }): Promise<CommissionRuleReadModel | null> {
    return this.prisma.commissionRule.findUnique({
      where: { id: input.id },
      include: {
        currency: true,
      },
    });
  }

  async listRules(input: {
    currencyCode?: string;
    holderType?: OriginAccountHolderType;
    enabled?: boolean;
  }): Promise<CommissionRuleReadModel[]> {
    return this.prisma.commissionRule.findMany({
      where: {
        currency: input.currencyCode ? { code: input.currencyCode } : undefined,
        holderType: input.holderType,
        enabled: input.enabled,
      },
      include: {
        currency: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }
}
