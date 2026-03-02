import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { CatalogsQueryPort } from 'src/modules/catalogs/domain/ports/catalogs-query.port';
import { CATALOGS_QUERY_PORT, DELIVERY_FEES_COMMAND_PORT, DELIVERY_FEES_QUERY_PORT } from 'src/shared/constants/tokens';
import { DeliveryFeesCommandPort } from '../../domain/ports/delivery-fees-command.port';
import { DeliveryFeeRuleReadModel, DeliveryFeesQueryPort } from '../../domain/ports/delivery-fees-query.port';

@Injectable()
export class AdminCreateDeliveryFeeRuleUseCase {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(DELIVERY_FEES_COMMAND_PORT)
    private readonly command: DeliveryFeesCommandPort,
    @Inject(DELIVERY_FEES_QUERY_PORT)
    private readonly query: DeliveryFeesQueryPort,
  ) {}

  async execute(input: {
    currencyCode: string;
    country: string;
    region?: string | null;
    city?: string | null;
    amount: string;
    enabled?: boolean;
  }): Promise<DeliveryFeeRuleReadModel> {
    const currencyCode = input.currencyCode.trim().toUpperCase();
    const currency = await this.catalogsQuery.findCurrencyByCode({ code: currencyCode });

    if (!currency) {
      throw new NotFoundDomainException('Currency not found');
    }

    const amount = new Prisma.Decimal(input.amount);
    if (amount.lt(0)) {
      throw new ValidationDomainException('amount must be greater than or equal to 0');
    }

    if (!input.country?.trim()) {
      throw new ValidationDomainException('country is required');
    }

    const id = await this.command.createRule({
      currencyId: currency.id,
      country: input.country,
      region: input.region,
      city: input.city,
      amount,
      enabled: input.enabled ?? true,
    });

    const created = await this.query.findById({ id });
    if (!created) {
      throw new NotFoundDomainException('Delivery fee rule not found after create');
    }

    return created;
  }
}
