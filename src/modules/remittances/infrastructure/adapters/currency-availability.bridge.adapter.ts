import { Inject, Injectable } from '@nestjs/common';
import { CatalogsQueryPort } from 'src/modules/catalogs/domain/ports/catalogs-query.port';
import { CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { CurrencyAvailabilityPort } from '../../domain/ports/currency-availability.port';

@Injectable()
export class CurrencyAvailabilityBridgeAdapter implements CurrencyAvailabilityPort {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
  ) {}

  async findEnabledCurrencyByCode(input: { code: string }) {
    const currency = await this.catalogsQuery.findCurrencyByCode({ code: input.code });
    if (!currency || !currency.enabled) {
      return null;
    }

    return { id: currency.id, code: currency.code, enabled: currency.enabled };
  }

  async findCurrencyById(input: { id: string }) {
    const currency = await this.catalogsQuery.findCurrencyById({ id: input.id });
    if (!currency) {
      return null;
    }

    return { id: currency.id, code: currency.code, enabled: currency.enabled };
  }
}
