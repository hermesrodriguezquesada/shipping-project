import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { DELIVERY_FEES_COMMAND_PORT, DELIVERY_FEES_QUERY_PORT } from 'src/shared/constants/tokens';
import { DeliveryFeesCommandPort } from '../../domain/ports/delivery-fees-command.port';
import { DeliveryFeeRuleReadModel, DeliveryFeesQueryPort } from '../../domain/ports/delivery-fees-query.port';

@Injectable()
export class AdminUpdateDeliveryFeeRuleUseCase {
  constructor(
    @Inject(DELIVERY_FEES_COMMAND_PORT)
    private readonly command: DeliveryFeesCommandPort,
    @Inject(DELIVERY_FEES_QUERY_PORT)
    private readonly query: DeliveryFeesQueryPort,
  ) {}

  async execute(input: {
    id: string;
    country?: string;
    region?: string | null;
    city?: string | null;
    amount?: string;
    enabled?: boolean;
  }): Promise<DeliveryFeeRuleReadModel> {
    const existing = await this.query.findById({ id: input.id });
    if (!existing) {
      throw new NotFoundDomainException('Delivery fee rule not found');
    }

    if (input.amount !== undefined && new Prisma.Decimal(input.amount).lt(0)) {
      throw new ValidationDomainException('amount must be greater than or equal to 0');
    }

    await this.command.updateRule({
      id: input.id,
      country: input.country,
      region: input.region,
      city: input.city,
      amount: input.amount === undefined ? undefined : new Prisma.Decimal(input.amount),
      enabled: input.enabled,
    });

    const updated = await this.query.findById({ id: input.id });
    if (!updated) {
      throw new NotFoundDomainException('Delivery fee rule not found after update');
    }

    return updated;
  }
}
