import { Prisma } from '@prisma/client';
import { CurrencyCatalogReadModel } from 'src/modules/catalogs/domain/ports/catalogs-query.port';

export interface DeliveryFeeRuleReadModel {
  id: string;
  currencyId: string;
  country: string;
  region: string | null;
  city: string | null;
  amount: Prisma.Decimal;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  currency: CurrencyCatalogReadModel;
}

export interface DeliveryFeesQueryPort {
  findApplicableRule(input: {
    currencyCode: string;
    country: string;
    region?: string | null;
    city?: string | null;
  }): Promise<DeliveryFeeRuleReadModel | null>;
  findById(input: { id: string }): Promise<DeliveryFeeRuleReadModel | null>;
  listRules(input: {
    currencyCode?: string;
    country?: string;
    enabled?: boolean;
  }): Promise<DeliveryFeeRuleReadModel[]>;
}
