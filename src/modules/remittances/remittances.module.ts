import { Module } from '@nestjs/common';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { AppConfigModule } from 'src/core/config/config.module';
import { REMITTANCE_COMMAND_PORT, REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { AdminRemittancesUseCase } from './application/use-cases/admin-remittances.usecase';
import { CatalogsAndFxUseCase } from './application/use-cases/catalogs-and-fx.usecase';
import { CreateRemittanceDraftV2UseCase } from './application/use-cases/create-remittance-draft-v2.usecase';
import { CreateRemittanceDraftUseCase } from './application/use-cases/create-remittance-draft.usecase';
import { GetMyRemittanceUseCase } from './application/use-cases/get-my-remittance.usecase';
import { ListMyRemittancesUseCase } from './application/use-cases/list-my-remittances.usecase';
import { RemittanceLifecycleUseCase } from './application/use-cases/remittance-lifecycle.usecase';
import { SetRemittanceAmountUseCase } from './application/use-cases/set-remittance-amount.usecase';
import { SetRemittanceDestinationCupCardUseCase } from './application/use-cases/set-remittance-destination-cup-card.usecase';
import { SetRemittanceOriginAccountHolderUseCase } from './application/use-cases/set-remittance-origin-account-holder.usecase';
import { SetRemittanceOriginAccountUseCase } from './application/use-cases/set-remittance-origin-account.usecase';
import { SetRemittanceReceivingCurrencyUseCase } from './application/use-cases/set-remittance-receiving-currency.usecase';
import { SetRemittanceReceptionMethodUseCase } from './application/use-cases/set-remittance-reception-method.usecase';
import { SubmitRemittanceUseCase } from './application/use-cases/submit-remittance.usecase';
import { PrismaRemittanceCommandAdapter } from './infrastructure/adapters/prisma-remittance-command.adapter';
import { PrismaRemittanceQueryAdapter } from './infrastructure/adapters/prisma-remittance-query.adapter';
import { RemittancesResolver } from './presentation/graphql/resolvers/remittances.resolver';

@Module({
  imports: [AppConfigModule],
  providers: [
    PrismaRemittanceCommandAdapter,
    PrismaRemittanceQueryAdapter,
    { provide: REMITTANCE_COMMAND_PORT, useExisting: PrismaRemittanceCommandAdapter },
    { provide: REMITTANCE_QUERY_PORT, useExisting: PrismaRemittanceQueryAdapter },
    AdminRemittancesUseCase,
    CatalogsAndFxUseCase,
    CreateRemittanceDraftV2UseCase,
    CreateRemittanceDraftUseCase,
    GetMyRemittanceUseCase,
    ListMyRemittancesUseCase,
    RemittanceLifecycleUseCase,
    SetRemittanceAmountUseCase,
    SetRemittanceDestinationCupCardUseCase,
    SetRemittanceOriginAccountHolderUseCase,
    SetRemittanceOriginAccountUseCase,
    SetRemittanceReceivingCurrencyUseCase,
    SetRemittanceReceptionMethodUseCase,
    SubmitRemittanceUseCase,
    RolesGuard,
    RemittancesResolver,
  ],
})
export class RemittancesModule {}
