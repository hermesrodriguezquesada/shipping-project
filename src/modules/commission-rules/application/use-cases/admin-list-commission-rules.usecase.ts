import { Inject, Injectable } from '@nestjs/common';
import { OriginAccountHolderType } from '@prisma/client';
import { COMMISSION_RULES_QUERY_PORT } from 'src/shared/constants/tokens';
import { CommissionRuleReadModel, CommissionRulesQueryPort } from '../../domain/ports/commission-rules-query.port';

@Injectable()
export class AdminListCommissionRulesUseCase {
  constructor(
    @Inject(COMMISSION_RULES_QUERY_PORT)
    private readonly query: CommissionRulesQueryPort,
  ) {}

  async execute(input: {
    currencyCode?: string;
    holderType?: OriginAccountHolderType;
    enabled?: boolean;
  }): Promise<CommissionRuleReadModel[]> {
    return this.query.listRules({
      currencyCode: input.currencyCode?.trim().toUpperCase(),
      holderType: input.holderType,
      enabled: input.enabled,
    });
  }
}
