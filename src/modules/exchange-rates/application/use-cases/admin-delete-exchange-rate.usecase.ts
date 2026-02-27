import { Inject, Injectable } from '@nestjs/common';
import { EXCHANGE_RATES_COMMAND_PORT } from 'src/shared/constants/tokens';
import { ExchangeRatesCommandPort } from '../../domain/ports/exchange-rates-command.port';

@Injectable()
export class AdminDeleteExchangeRateUseCase {
  constructor(
    @Inject(EXCHANGE_RATES_COMMAND_PORT)
    private readonly exchangeRatesCommand: ExchangeRatesCommandPort,
  ) {}

  async execute(id: string): Promise<boolean> {
    await this.exchangeRatesCommand.deleteExchangeRate({ id });
    return true;
  }
}
