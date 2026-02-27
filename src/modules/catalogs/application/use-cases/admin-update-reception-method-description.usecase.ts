import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { CATALOGS_COMMAND_PORT, CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { CatalogsCommandPort } from '../../domain/ports/catalogs-command.port';
import { CatalogsQueryPort, ReceptionMethodCatalogReadModel } from '../../domain/ports/catalogs-query.port';

@Injectable()
export class AdminUpdateReceptionMethodDescriptionUseCase {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(CATALOGS_COMMAND_PORT)
    private readonly catalogsCommand: CatalogsCommandPort,
  ) {}

  async execute(input: { code: string; description?: string }): Promise<ReceptionMethodCatalogReadModel> {
    const code = input.code.trim().toUpperCase();
    const existing = await this.catalogsQuery.findReceptionMethodByCode({ code });
    if (!existing) throw new NotFoundDomainException('Reception method not found');

    await this.catalogsCommand.updateReceptionMethodDescription({
      code,
      description: input.description?.trim() || null,
    });

    const updated = await this.catalogsQuery.findReceptionMethodByCode({ code });
    if (!updated) throw new NotFoundDomainException('Reception method not found');
    return updated;
  }
}
