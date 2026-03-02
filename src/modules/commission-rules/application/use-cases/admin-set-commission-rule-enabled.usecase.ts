import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { COMMISSION_RULES_COMMAND_PORT, COMMISSION_RULES_QUERY_PORT } from 'src/shared/constants/tokens';
import { CommissionRulesCommandPort } from '../../domain/ports/commission-rules-command.port';
import { CommissionRuleReadModel, CommissionRulesQueryPort } from '../../domain/ports/commission-rules-query.port';

@Injectable()
export class AdminSetCommissionRuleEnabledUseCase {
  constructor(
    @Inject(COMMISSION_RULES_COMMAND_PORT)
    private readonly command: CommissionRulesCommandPort,
    @Inject(COMMISSION_RULES_QUERY_PORT)
    private readonly query: CommissionRulesQueryPort,
  ) {}

  async execute(input: { id: string; enabled: boolean }): Promise<CommissionRuleReadModel> {
    const existing = await this.query.findById({ id: input.id });
    if (!existing) {
      throw new NotFoundDomainException('Commission rule not found');
    }

    await this.command.setEnabled(input);

    const updated = await this.query.findById({ id: input.id });
    if (!updated) {
      throw new NotFoundDomainException('Commission rule not found after update');
    }

    return updated;
  }
}
