import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { CATALOGS_COMMAND_PORT, CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { CatalogsCommandPort } from '../../domain/ports/catalogs-command.port';
import { CatalogsQueryPort, CurrencyCatalogReadModel } from '../../domain/ports/catalogs-query.port';

@Injectable()
export class AdminSetCurrencyEnabledUseCase {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(CATALOGS_COMMAND_PORT)
    private readonly catalogsCommand: CatalogsCommandPort,
  ) {}

  async execute(input: { code: string; enabled: boolean }): Promise<CurrencyCatalogReadModel> {
    const code = input.code.trim().toUpperCase();
    const existing = await this.catalogsQuery.findCurrencyByCode({ code });
    if (!existing) throw new NotFoundDomainException('Currency not found');

    await this.catalogsCommand.setCurrencyEnabled({ code, enabled: input.enabled });

    const updated = await this.catalogsQuery.findCurrencyByCode({ code });
    if (!updated) throw new NotFoundDomainException('Currency not found');
    return updated;
  }
}
