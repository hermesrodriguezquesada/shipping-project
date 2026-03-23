import { Module } from '@nestjs/common';
import { AppConfigModule } from 'src/core/config/config.module';
import { ELTOQUE_RATES_PORT } from 'src/shared/constants/tokens';
import { GetElToqueRatesUseCase } from './application/use-cases/get-eltoque-rates.usecase';
import { HttpElToqueRatesAdapter } from './infrastructure/adapters/http-eltoque-rates.adapter';
import { ElToqueRatesResolver } from './presentation/graphql/resolvers/eltoque-rates.resolver';

@Module({
  imports: [AppConfigModule],
  providers: [
    HttpElToqueRatesAdapter,
    { provide: ELTOQUE_RATES_PORT, useExisting: HttpElToqueRatesAdapter },
    GetElToqueRatesUseCase,
    ElToqueRatesResolver,
  ],
})
export class ElToqueRatesModule {}
