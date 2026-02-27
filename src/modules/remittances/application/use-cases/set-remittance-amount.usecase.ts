import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppConfigService } from 'src/core/config/config.service';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { REMITTANCE_COMMAND_PORT, REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';

@Injectable()
export class SetRemittanceAmountUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
    private readonly config: AppConfigService,
  ) {}

  async execute(input: { remittanceId: string; senderUserId: string; amount: string }): Promise<boolean> {
    const remittance = await this.remittanceQuery.findByIdAndSenderUser({
      id: input.remittanceId,
      senderUserId: input.senderUserId,
    });

    if (!remittance) {
      throw new NotFoundDomainException('Remittance not found');
    }

    const amount = this.parseAmount(input.amount);

    if (amount.lte(0)) {
      throw new ValidationDomainException('Amount must be greater than 0');
    }

    const min = new Prisma.Decimal(this.config.remittanceAmountMin);
    const max = new Prisma.Decimal(this.config.remittanceAmountMax);

    if (amount.lt(min)) {
      throw new ValidationDomainException(`Amount must be greater than or equal to ${min.toString()}`);
    }

    if (amount.gt(max)) {
      throw new ValidationDomainException(`Amount must be less than or equal to ${max.toString()}`);
    }

    await this.remittanceCommand.updateAmount({
      id: input.remittanceId,
      amount,
    });

    return true;
  }

  private parseAmount(value: string): Prisma.Decimal {
    const normalized = value?.trim();

    if (!normalized) {
      throw new ValidationDomainException('Amount is required');
    }

    try {
      const amount = new Prisma.Decimal(normalized);

      if (!amount.isFinite()) {
        throw new ValidationDomainException('Amount must be a valid decimal number');
      }

      return amount;
    } catch {
      throw new ValidationDomainException('Amount must be a valid decimal number');
    }
  }
}