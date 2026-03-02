import { Module } from '@nestjs/common';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { AppConfigModule } from 'src/core/config/config.module';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';
import { PricingModule } from '../pricing/pricing.module';
import {
  CURRENCY_AVAILABILITY_PORT,
  PAYMENT_METHOD_AVAILABILITY_PORT,
  RECEPTION_METHOD_AVAILABILITY_PORT,
  REMITTANCE_COMMAND_PORT,
  REMITTANCE_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { AdminRemittancesUseCase } from './application/use-cases/admin-remittances.usecase';
import { GetMyRemittanceUseCase } from './application/use-cases/get-my-remittance.usecase';
import { ListMyRemittancesUseCase } from './application/use-cases/list-my-remittances.usecase';
import { RemittanceLifecycleUseCase } from './application/use-cases/remittance-lifecycle.usecase';
import { SubmitRemittanceV2UseCase } from './application/use-cases/submit-remittance-v2.usecase';
import { CurrencyAvailabilityBridgeAdapter } from './infrastructure/adapters/currency-availability.bridge.adapter';
import { PaymentMethodAvailabilityBridgeAdapter } from './infrastructure/adapters/payment-method-availability.bridge.adapter';
import { PrismaRemittanceCommandAdapter } from './infrastructure/adapters/prisma-remittance-command.adapter';
import { PrismaRemittanceQueryAdapter } from './infrastructure/adapters/prisma-remittance-query.adapter';
import { ReceptionMethodAvailabilityBridgeAdapter } from './infrastructure/adapters/reception-method-availability.bridge.adapter';
import { RemittancesResolver } from './presentation/graphql/resolvers/remittances.resolver';

@Module({
  imports: [AppConfigModule, CatalogsModule, ExchangeRatesModule, PricingModule],
  providers: [
    PrismaRemittanceCommandAdapter,
    PrismaRemittanceQueryAdapter,
    { provide: REMITTANCE_COMMAND_PORT, useExisting: PrismaRemittanceCommandAdapter },
    { provide: REMITTANCE_QUERY_PORT, useExisting: PrismaRemittanceQueryAdapter },
    { provide: PAYMENT_METHOD_AVAILABILITY_PORT, useClass: PaymentMethodAvailabilityBridgeAdapter },
    { provide: RECEPTION_METHOD_AVAILABILITY_PORT, useClass: ReceptionMethodAvailabilityBridgeAdapter },
    { provide: CURRENCY_AVAILABILITY_PORT, useClass: CurrencyAvailabilityBridgeAdapter },
    AdminRemittancesUseCase,
    GetMyRemittanceUseCase,
    ListMyRemittancesUseCase,
    RemittanceLifecycleUseCase,
    SubmitRemittanceV2UseCase,
    RolesGuard,
    RemittancesResolver,
  ],
})
export class RemittancesModule {}
