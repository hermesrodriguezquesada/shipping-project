import { Inject, Injectable } from '@nestjs/common';
import { OriginAccountHolderType, Prisma } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { CatalogsQueryPort } from 'src/modules/catalogs/domain/ports/catalogs-query.port';
import { CATALOGS_QUERY_PORT, COMMISSION_RULES_COMMAND_PORT, COMMISSION_RULES_QUERY_PORT } from 'src/shared/constants/tokens';
import { CommissionRulesCommandPort } from '../../domain/ports/commission-rules-command.port';
import { CommissionRuleReadModel, CommissionRulesQueryPort } from '../../domain/ports/commission-rules-query.port';

@Injectable()
export class AdminCreateCommissionRuleUseCase {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(COMMISSION_RULES_COMMAND_PORT)
    private readonly command: CommissionRulesCommandPort,
    @Inject(COMMISSION_RULES_QUERY_PORT)
    private readonly query: CommissionRulesQueryPort,
  ) {}

  async execute(input: {
    currencyCode: string;
    holderType: OriginAccountHolderType;
    thresholdAmount: string;
    percentRate: string;
    flatFee: string;
    enabled?: boolean;
  }): Promise<CommissionRuleReadModel> {
    const currencyCode = input.currencyCode.trim().toUpperCase();
    const currency = await this.catalogsQuery.findCurrencyByCode({ code: currencyCode });

    if (!currency) {
      throw new NotFoundDomainException('Currency not found');
    }

    this.validateNumbers(input);

    const id = await this.command.createVersion({
      currencyId: currency.id,
      holderType: input.holderType,
      thresholdAmount: new Prisma.Decimal(input.thresholdAmount),
      percentRate: new Prisma.Decimal(input.percentRate),
      flatFee: new Prisma.Decimal(input.flatFee),
      enabled: input.enabled ?? true,
    });

    const created = await this.query.findById({ id });
    if (!created) {
      throw new NotFoundDomainException('Commission rule not found after create');
    }

    return created;
  }

  private validateNumbers(input: { thresholdAmount: string; percentRate: string; flatFee: string }) {
    const threshold = new Prisma.Decimal(input.thresholdAmount);
    const percent = new Prisma.Decimal(input.percentRate);
    const flat = new Prisma.Decimal(input.flatFee);

    if (threshold.lt(0)) {
      throw new ValidationDomainException('thresholdAmount must be greater than or equal to 0');
    }

    if (percent.lt(0)) {
      throw new ValidationDomainException('percentRate must be greater than or equal to 0');
    }

    if (flat.lt(0)) {
      throw new ValidationDomainException('flatFee must be greater than or equal to 0');
    }
  }
}
