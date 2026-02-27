import { Module } from '@nestjs/common';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { EXCHANGE_RATES_COMMAND_PORT, EXCHANGE_RATES_QUERY_PORT } from 'src/shared/constants/tokens';
import { AdminCreateExchangeRateUseCase } from './application/use-cases/admin-create-exchange-rate.usecase';
import { AdminDeleteExchangeRateUseCase } from './application/use-cases/admin-delete-exchange-rate.usecase';
import { AdminListExchangeRatesUseCase } from './application/use-cases/admin-list-exchange-rates.usecase';
import { AdminUpdateExchangeRateUseCase } from './application/use-cases/admin-update-exchange-rate.usecase';
import { GetLatestExchangeRateUseCase } from './application/use-cases/get-latest-exchange-rate.usecase';
import { PrismaExchangeRatesCommandAdapter } from './infrastructure/adapters/prisma-exchange-rates-command.adapter';
import { PrismaExchangeRatesQueryAdapter } from './infrastructure/adapters/prisma-exchange-rates-query.adapter';
import { ExchangeRatesResolver } from './presentation/graphql/resolvers/exchange-rates.resolver';

@Module({
  imports: [CatalogsModule],
  providers: [
    PrismaExchangeRatesCommandAdapter,
    PrismaExchangeRatesQueryAdapter,
    { provide: EXCHANGE_RATES_QUERY_PORT, useExisting: PrismaExchangeRatesQueryAdapter },
    { provide: EXCHANGE_RATES_COMMAND_PORT, useExisting: PrismaExchangeRatesCommandAdapter },
    GetLatestExchangeRateUseCase,
    AdminListExchangeRatesUseCase,
    AdminCreateExchangeRateUseCase,
    AdminUpdateExchangeRateUseCase,
    AdminDeleteExchangeRateUseCase,
    ExchangeRatesResolver,
  ],
  exports: [EXCHANGE_RATES_QUERY_PORT, EXCHANGE_RATES_COMMAND_PORT],
})
export class ExchangeRatesModule {}
