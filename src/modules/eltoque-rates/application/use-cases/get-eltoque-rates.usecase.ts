import { Inject, Injectable } from '@nestjs/common';
import { ELTOQUE_RATES_PORT } from 'src/shared/constants/tokens';
import { ElToqueRatesPort } from '../../domain/ports/eltoque-rates.port';

@Injectable()
export class GetElToqueRatesUseCase {
  constructor(
    @Inject(ELTOQUE_RATES_PORT)
    private readonly elToqueRatesPort: ElToqueRatesPort,
  ) {}

  async execute(params: { dateFrom?: string; dateTo?: string }): Promise<string> {
    return this.elToqueRatesPort.getRates(params);
  }
}
