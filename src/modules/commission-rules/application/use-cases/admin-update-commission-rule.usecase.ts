import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { COMMISSION_RULES_QUERY_PORT } from 'src/shared/constants/tokens';
import { AdminCreateCommissionRuleUseCase } from './admin-create-commission-rule.usecase';
import { CommissionRuleReadModel, CommissionRulesQueryPort } from '../../domain/ports/commission-rules-query.port';

@Injectable()
export class AdminUpdateCommissionRuleUseCase {
  constructor(
    @Inject(COMMISSION_RULES_QUERY_PORT)
    private readonly query: CommissionRulesQueryPort,
    private readonly createUseCase: AdminCreateCommissionRuleUseCase,
  ) {}

  async execute(input: {
    id: string;
    thresholdAmount?: string;
    percentRate?: string;
    flatFee?: string;
    enabled?: boolean;
  }): Promise<CommissionRuleReadModel> {
    const current = await this.query.findById({ id: input.id });
    if (!current) {
      throw new NotFoundDomainException('Commission rule not found');
    }

    return this.createUseCase.execute({
      currencyCode: current.currency.code,
      holderType: current.holderType,
      thresholdAmount: input.thresholdAmount ?? current.thresholdAmount.toString(),
      percentRate: input.percentRate ?? current.percentRate.toString(),
      flatFee: input.flatFee ?? current.flatFee.toString(),
      enabled: input.enabled ?? current.enabled,
    });
  }
}
