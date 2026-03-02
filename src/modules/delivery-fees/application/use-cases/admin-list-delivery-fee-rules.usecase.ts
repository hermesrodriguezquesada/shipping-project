import { Inject, Injectable } from '@nestjs/common';
import { DELIVERY_FEES_QUERY_PORT } from 'src/shared/constants/tokens';
import { DeliveryFeeRuleReadModel, DeliveryFeesQueryPort } from '../../domain/ports/delivery-fees-query.port';

@Injectable()
export class AdminListDeliveryFeeRulesUseCase {
  constructor(
    @Inject(DELIVERY_FEES_QUERY_PORT)
    private readonly query: DeliveryFeesQueryPort,
  ) {}

  async execute(input: { currencyCode?: string; country?: string; enabled?: boolean }): Promise<DeliveryFeeRuleReadModel[]> {
    return this.query.listRules({
      currencyCode: input.currencyCode?.trim().toUpperCase(),
      country: input.country,
      enabled: input.enabled,
    });
  }
}
