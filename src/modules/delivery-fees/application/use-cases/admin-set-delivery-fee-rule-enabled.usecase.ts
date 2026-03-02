import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { DELIVERY_FEES_COMMAND_PORT, DELIVERY_FEES_QUERY_PORT } from 'src/shared/constants/tokens';
import { DeliveryFeesCommandPort } from '../../domain/ports/delivery-fees-command.port';
import { DeliveryFeeRuleReadModel, DeliveryFeesQueryPort } from '../../domain/ports/delivery-fees-query.port';

@Injectable()
export class AdminSetDeliveryFeeRuleEnabledUseCase {
  constructor(
    @Inject(DELIVERY_FEES_COMMAND_PORT)
    private readonly command: DeliveryFeesCommandPort,
    @Inject(DELIVERY_FEES_QUERY_PORT)
    private readonly query: DeliveryFeesQueryPort,
  ) {}

  async execute(input: { id: string; enabled: boolean }): Promise<DeliveryFeeRuleReadModel> {
    const existing = await this.query.findById({ id: input.id });
    if (!existing) {
      throw new NotFoundDomainException('Delivery fee rule not found');
    }

    await this.command.setEnabled(input);

    const updated = await this.query.findById({ id: input.id });
    if (!updated) {
      throw new NotFoundDomainException('Delivery fee rule not found after update');
    }

    return updated;
  }
}
