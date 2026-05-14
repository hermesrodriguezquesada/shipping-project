import { Module } from '@nestjs/common';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { ExchangeRateHistoryModule } from '../exchange-rate-history/exchange-rate-history.module';
import { UsersModule } from '../users/users.module';
import { VIP_EXCHANGE_RATE_COMMAND_PORT, VIP_EXCHANGE_RATE_QUERY_PORT } from 'src/shared/constants/tokens';
import { AdminCreateVipExchangeRateUseCase } from './application/use-cases/admin-create-vip-exchange-rate.usecase';
import { AdminListVipExchangeRatesUseCase } from './application/use-cases/admin-list-vip-exchange-rates.usecase';
import { AdminSetVipExchangeRateEnabledUseCase } from './application/use-cases/admin-set-vip-exchange-rate-enabled.usecase';
import { AdminUpdateVipExchangeRateUseCase } from './application/use-cases/admin-update-vip-exchange-rate.usecase';
import { VipProfitPreviewUseCase } from './application/use-cases/vip-profit-preview.usecase';
import { ExchangeRateQueryPort } from './domain/ports/exchange-rate-query.port';
import { PrismaExchangeRateQueryAdapter } from './infrastructure/adapters/prisma-exchange-rate-query.adapter';
import { PrismaVipExchangeRateCommandAdapter } from './infrastructure/adapters/prisma-vip-exchange-rate-command.adapter';
import { PrismaVipExchangeRateQueryAdapter } from './infrastructure/adapters/prisma-vip-exchange-rate-query.adapter';
import { VipPricingResolver } from './presentation/graphql/resolvers/vip-pricing.resolver';

@Module({
  imports: [CatalogsModule, UsersModule, ExchangeRateHistoryModule],
  providers: [
    PrismaExchangeRateQueryAdapter,
    PrismaVipExchangeRateCommandAdapter,
    PrismaVipExchangeRateQueryAdapter,
    { provide: ExchangeRateQueryPort, useExisting: PrismaExchangeRateQueryAdapter },
    { provide: VIP_EXCHANGE_RATE_QUERY_PORT, useExisting: PrismaVipExchangeRateQueryAdapter },
    { provide: VIP_EXCHANGE_RATE_COMMAND_PORT, useExisting: PrismaVipExchangeRateCommandAdapter },
    AdminCreateVipExchangeRateUseCase,
    AdminUpdateVipExchangeRateUseCase,
    AdminSetVipExchangeRateEnabledUseCase,
    AdminListVipExchangeRatesUseCase,
    VipProfitPreviewUseCase,
    VipPricingResolver,
  ],
  exports: [VIP_EXCHANGE_RATE_QUERY_PORT, VIP_EXCHANGE_RATE_COMMAND_PORT],
})
export class VipPricingModule {}