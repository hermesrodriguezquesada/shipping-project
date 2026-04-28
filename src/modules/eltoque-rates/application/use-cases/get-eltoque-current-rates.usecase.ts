import { Inject, Injectable } from '@nestjs/common';
import { ELTOQUE_CURRENT_RATES_PORT } from 'src/shared/constants/tokens';
import { ElToqueRateEntity } from '../../domain/entities/eltoque-rate.entity';
import { ElToqueCurrentRatesPort } from '../../domain/ports/eltoque-current-rates.port';

@Injectable()
export class GetElToqueCurrentRatesUseCase {
  constructor(
    @Inject(ELTOQUE_CURRENT_RATES_PORT)
    private readonly elToqueCurrentRatesPort: ElToqueCurrentRatesPort,
  ) {}

  async execute(): Promise<ElToqueRateEntity[]> {
    return this.elToqueCurrentRatesPort.getCurrentRates();
  }
}