import { Inject, Injectable } from '@nestjs/common';
import { CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { CatalogsQueryPort, ReceptionMethodCatalogReadModel } from '../../domain/ports/catalogs-query.port';

@Injectable()
export class ListReceptionMethodsUseCase {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
  ) {}

  execute(enabledOnly = true): Promise<ReceptionMethodCatalogReadModel[]> {
    return this.catalogsQuery.listReceptionMethods({ enabledOnly });
  }
}
