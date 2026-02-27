import { Inject, Injectable } from '@nestjs/common';
import { CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { CatalogsQueryPort, CurrencyCatalogReadModel } from '../../domain/ports/catalogs-query.port';

@Injectable()
export class ListCurrenciesUseCase {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
  ) {}

  execute(enabledOnly = true): Promise<CurrencyCatalogReadModel[]> {
    return this.catalogsQuery.listCurrencies({ enabledOnly });
  }
}
