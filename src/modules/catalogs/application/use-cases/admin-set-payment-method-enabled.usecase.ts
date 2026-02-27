import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { CATALOGS_COMMAND_PORT, CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { CatalogsCommandPort } from '../../domain/ports/catalogs-command.port';
import { CatalogsQueryPort, PaymentMethodReadModel } from '../../domain/ports/catalogs-query.port';

@Injectable()
export class AdminSetPaymentMethodEnabledUseCase {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(CATALOGS_COMMAND_PORT)
    private readonly catalogsCommand: CatalogsCommandPort,
  ) {}

  async execute(input: { code: string; enabled: boolean }): Promise<PaymentMethodReadModel> {
    const code = input.code.trim().toUpperCase();
    const existing = await this.catalogsQuery.findPaymentMethodByCode({ code });
    if (!existing) throw new NotFoundDomainException('Payment method not found');

    await this.catalogsCommand.setPaymentMethodEnabled({ code, enabled: input.enabled });

    const updated = await this.catalogsQuery.findPaymentMethodByCode({ code });
    if (!updated) throw new NotFoundDomainException('Payment method not found');
    return updated;
  }
}
