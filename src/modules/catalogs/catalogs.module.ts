import { Module } from '@nestjs/common';
import { CATALOGS_COMMAND_PORT, CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { AdminCreateCurrencyUseCase } from './application/use-cases/admin-create-currency.usecase';
import { AdminSetCurrencyEnabledUseCase } from './application/use-cases/admin-set-currency-enabled.usecase';
import { AdminSetPaymentMethodEnabledUseCase } from './application/use-cases/admin-set-payment-method-enabled.usecase';
import { AdminSetReceptionMethodEnabledUseCase } from './application/use-cases/admin-set-reception-method-enabled.usecase';
import { AdminUpdateCurrencyUseCase } from './application/use-cases/admin-update-currency.usecase';
import { AdminUpdatePaymentMethodDescriptionUseCase } from './application/use-cases/admin-update-payment-method-description.usecase';
import { AdminUpdateReceptionMethodDescriptionUseCase } from './application/use-cases/admin-update-reception-method-description.usecase';
import { ListCurrenciesUseCase } from './application/use-cases/list-currencies.usecase';
import { ListPaymentMethodsUseCase } from './application/use-cases/list-payment-methods.usecase';
import { ListReceptionMethodsUseCase } from './application/use-cases/list-reception-methods.usecase';
import { PrismaCatalogsCommandAdapter } from './infrastructure/adapters/prisma-catalogs-command.adapter';
import { PrismaCatalogsQueryAdapter } from './infrastructure/adapters/prisma-catalogs-query.adapter';
import { CatalogsResolver } from './presentation/graphql/resolvers/catalogs.resolver';

@Module({
  providers: [
    PrismaCatalogsCommandAdapter,
    PrismaCatalogsQueryAdapter,
    { provide: CATALOGS_QUERY_PORT, useExisting: PrismaCatalogsQueryAdapter },
    { provide: CATALOGS_COMMAND_PORT, useExisting: PrismaCatalogsCommandAdapter },
    ListPaymentMethodsUseCase,
    AdminUpdatePaymentMethodDescriptionUseCase,
    AdminSetPaymentMethodEnabledUseCase,
    ListReceptionMethodsUseCase,
    AdminUpdateReceptionMethodDescriptionUseCase,
    AdminSetReceptionMethodEnabledUseCase,
    ListCurrenciesUseCase,
    AdminCreateCurrencyUseCase,
    AdminUpdateCurrencyUseCase,
    AdminSetCurrencyEnabledUseCase,
    CatalogsResolver,
  ],
  exports: [CATALOGS_QUERY_PORT, CATALOGS_COMMAND_PORT],
})
export class CatalogsModule {}
