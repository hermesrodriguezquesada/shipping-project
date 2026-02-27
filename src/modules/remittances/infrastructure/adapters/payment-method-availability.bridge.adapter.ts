import { Inject, Injectable } from '@nestjs/common';
import { CatalogsQueryPort } from 'src/modules/catalogs/domain/ports/catalogs-query.port';
import { CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { PaymentMethodAvailabilityPort } from '../../domain/ports/payment-method-availability.port';

@Injectable()
export class PaymentMethodAvailabilityBridgeAdapter implements PaymentMethodAvailabilityPort {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
  ) {}

  async findEnabledPaymentMethodByCode(input: { code: string }) {
    const paymentMethod = await this.catalogsQuery.findPaymentMethodByCode({ code: input.code });
    if (!paymentMethod || !paymentMethod.enabled) {
      return null;
    }

    return { id: paymentMethod.id, code: paymentMethod.code, enabled: paymentMethod.enabled };
  }
}
