import { Inject, Injectable } from '@nestjs/common';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { CATALOGS_COMMAND_PORT, CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { CatalogsCommandPort } from '../../domain/ports/catalogs-command.port';
import { CatalogsQueryPort, PaymentMethodReadModel } from '../../domain/ports/catalogs-query.port';

@Injectable()
export class AdminCreatePaymentMethodUseCase {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(CATALOGS_COMMAND_PORT)
    private readonly catalogsCommand: CatalogsCommandPort,
  ) {}

  async execute(input: {
    code: string;
    name: string;
    description?: string;
    additionalData?: string;
    imgUrl?: string;
    enabled?: boolean;
  }): Promise<PaymentMethodReadModel> {
    const code = input.code.trim().toUpperCase();
    const name = input.name?.trim();

    if (!code || !name) {
      throw new ValidationDomainException('code and name are required');
    }

    const existing = await this.catalogsQuery.findPaymentMethodByCode({ code });
    if (existing) {
      throw new ValidationDomainException('Payment method code already exists');
    }

    await this.catalogsCommand.createPaymentMethod({
      code,
      name,
      description: input.description?.trim() || null,
      additionalData: input.additionalData?.trim() || null,
      imgUrl: input.imgUrl?.trim() || null,
      enabled: input.enabled ?? true,
    });

    const created = await this.catalogsQuery.findPaymentMethodByCode({ code });
    if (!created) {
      throw new ValidationDomainException('Payment method code already exists');
    }

    return created;
  }
}
