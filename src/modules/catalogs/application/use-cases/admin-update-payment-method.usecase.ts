import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { CATALOGS_COMMAND_PORT, CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { CatalogsCommandPort } from '../../domain/ports/catalogs-command.port';
import { CatalogsQueryPort, PaymentMethodReadModel } from '../../domain/ports/catalogs-query.port';

@Injectable()
export class AdminUpdatePaymentMethodUseCase {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(CATALOGS_COMMAND_PORT)
    private readonly catalogsCommand: CatalogsCommandPort,
  ) {}

  async execute(input: {
    code: string;
    description?: string;
    additionalData?: string;
  }): Promise<PaymentMethodReadModel> {
    const code = input.code.trim().toUpperCase();
    const existing = await this.catalogsQuery.findPaymentMethodByCode({ code });
    if (!existing) throw new NotFoundDomainException('Payment method not found');

    const hasDescription = input.description !== undefined;
    const hasAdditionalData = input.additionalData !== undefined;

    if (!hasDescription && !hasAdditionalData) {
      throw new ValidationDomainException('At least one of description or additionalData must be provided');
    }

    if (hasDescription) {
      await this.catalogsCommand.updatePaymentMethodDescription({
        code,
        description: input.description?.trim() || null,
      });
    }

    if (hasAdditionalData) {
      await this.catalogsCommand.updatePaymentMethodAdditionalData({
        code,
        additionalData: input.additionalData?.trim() || null,
      });
    }

    const updated = await this.catalogsQuery.findPaymentMethodByCode({ code });
    if (!updated) throw new NotFoundDomainException('Payment method not found');

    return updated;
  }
}
