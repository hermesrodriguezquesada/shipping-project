import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { VIP_EXCHANGE_RATE_COMMAND_PORT, VIP_EXCHANGE_RATE_QUERY_PORT } from 'src/shared/constants/tokens';
import { VipExchangeRateEntity } from '../../domain/entities/vip-exchange-rate.entity';
import { VipExchangeRateCommandPort } from '../../domain/ports/vip-exchange-rate-command.port';
import { VipExchangeRateQueryPort } from '../../domain/ports/vip-exchange-rate-query.port';

@Injectable()
export class AdminSetVipExchangeRateEnabledUseCase {
  constructor(
    @Inject(VIP_EXCHANGE_RATE_QUERY_PORT)
    private readonly vipExchangeRateQuery: VipExchangeRateQueryPort,
    @Inject(VIP_EXCHANGE_RATE_COMMAND_PORT)
    private readonly vipExchangeRateCommand: VipExchangeRateCommandPort,
  ) {}

  async execute(input: { id: string; enabled: boolean }): Promise<VipExchangeRateEntity> {
    const existing = await this.vipExchangeRateQuery.findById(input.id);
    if (!existing) {
      throw new NotFoundDomainException('VIP exchange rate not found');
    }

    await this.vipExchangeRateCommand.setEnabled(input);

    const updated = await this.vipExchangeRateQuery.findById(input.id);
    if (!updated) {
      throw new NotFoundDomainException('VIP exchange rate not found');
    }

    return updated;
  }
}