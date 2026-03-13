import { Inject, Injectable } from '@nestjs/common';
import { ReceptionPayoutMethod } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { CATALOGS_COMMAND_PORT, CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { CatalogsCommandPort } from '../../domain/ports/catalogs-command.port';
import { CatalogsQueryPort, ReceptionMethodCatalogReadModel } from '../../domain/ports/catalogs-query.port';

@Injectable()
export class AdminCreateReceptionMethodUseCase {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(CATALOGS_COMMAND_PORT)
    private readonly catalogsCommand: CatalogsCommandPort,
  ) {}

  async execute(input: {
    code: string;
    name: string;
    currencyCode: string;
    method: ReceptionPayoutMethod;
    description?: string;
    imgUrl?: string;
    enabled?: boolean;
  }): Promise<ReceptionMethodCatalogReadModel> {
    const code = input.code.trim().toUpperCase();
    const name = input.name?.trim();
    const currencyCode = input.currencyCode.trim().toUpperCase();

    if (!code || !name || !currencyCode) {
      throw new ValidationDomainException('code, name and currencyCode are required');
    }

    const existing = await this.catalogsQuery.findReceptionMethodByCode({ code });
    if (existing) {
      throw new ValidationDomainException('Reception method code already exists');
    }

    const currency = await this.catalogsQuery.findCurrencyByCode({ code: currencyCode });
    if (!currency) {
      throw new ValidationDomainException('Currency not found');
    }

    await this.catalogsCommand.createReceptionMethod({
      code,
      name,
      currencyId: currency.id,
      method: input.method,
      description: input.description?.trim() || null,
      imgUrl: input.imgUrl?.trim() || null,
      enabled: input.enabled ?? true,
    });

    const created = await this.catalogsQuery.findReceptionMethodByCode({ code });
    if (!created) {
      throw new ValidationDomainException('Reception method code already exists');
    }

    return created;
  }
}
