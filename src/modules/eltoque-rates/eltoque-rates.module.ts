import { Module } from '@nestjs/common';
import { AppConfigModule } from 'src/core/config/config.module';
import { ELTOQUE_CURRENT_RATES_PORT, ELTOQUE_RATES_PORT } from 'src/shared/constants/tokens';
import { GetElToqueCurrentRatesUseCase } from './application/use-cases/get-eltoque-current-rates.usecase';
import { GetElToqueRatesNormalizedUseCase } from './application/use-cases/get-eltoque-rates-normalized.usecase';
import { GetElToqueRatesUseCase } from './application/use-cases/get-eltoque-rates.usecase';
import { HttpElToqueCurrentRatesAdapter } from './infrastructure/adapters/http-eltoque-current-rates.adapter';
import { HttpElToqueRatesAdapter } from './infrastructure/adapters/http-eltoque-rates.adapter';
import { ElToqueRatesResolver } from './presentation/graphql/resolvers/eltoque-rates.resolver';

@Module({
  imports: [AppConfigModule],
  providers: [
    HttpElToqueRatesAdapter,
    HttpElToqueCurrentRatesAdapter,
    { provide: ELTOQUE_RATES_PORT, useExisting: HttpElToqueRatesAdapter },
    { provide: ELTOQUE_CURRENT_RATES_PORT, useExisting: HttpElToqueCurrentRatesAdapter },
    GetElToqueRatesUseCase,
    GetElToqueRatesNormalizedUseCase,
    GetElToqueCurrentRatesUseCase,
    ElToqueRatesResolver,
  ],
})
export class ElToqueRatesModule {}
