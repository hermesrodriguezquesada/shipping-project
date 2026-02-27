import { Prisma } from '@prisma/client';

export interface ExchangeRateSnapshot {
  id: string;
  fromCode: string;
  toCode: string;
  rate: Prisma.Decimal;
}

export interface ExchangeRateSnapshotPort {
  getLatestEnabledRate(input: { fromCode: string; toCode: string }): Promise<ExchangeRateSnapshot | null>;
}
