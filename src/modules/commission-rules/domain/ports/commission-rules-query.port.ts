import { OriginAccountHolderType, Prisma } from '@prisma/client';
import { CurrencyCatalogReadModel } from 'src/modules/catalogs/domain/ports/catalogs-query.port';

export interface CommissionRuleReadModel {
  id: string;
  currencyId: string;
  holderType: OriginAccountHolderType;
  version: number;
  thresholdAmount: Prisma.Decimal;
  percentRate: Prisma.Decimal;
  flatFee: Prisma.Decimal;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  currency: CurrencyCatalogReadModel;
}

export interface CommissionRulesQueryPort {
  findApplicableRule(input: { currencyCode: string; holderType: OriginAccountHolderType }): Promise<CommissionRuleReadModel | null>;
  findById(input: { id: string }): Promise<CommissionRuleReadModel | null>;
  listRules(input: { currencyCode?: string; holderType?: OriginAccountHolderType; enabled?: boolean }): Promise<CommissionRuleReadModel[]>;
}
