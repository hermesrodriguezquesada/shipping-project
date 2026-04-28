import { ElToqueRateEntity } from '../entities/eltoque-rate.entity';

export interface ElToqueCurrentRatesPort {
  getCurrentRates(): Promise<ElToqueRateEntity[]>;
}