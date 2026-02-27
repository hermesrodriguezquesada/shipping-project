import { Inject, Injectable } from '@nestjs/common';
import { CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { CatalogsQueryPort, PaymentMethodReadModel } from '../../domain/ports/catalogs-query.port';

@Injectable()
export class ListPaymentMethodsUseCase {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
  ) {}

  execute(enabledOnly = true): Promise<PaymentMethodReadModel[]> {
    return this.catalogsQuery.listPaymentMethods({ enabledOnly });
  }
}
