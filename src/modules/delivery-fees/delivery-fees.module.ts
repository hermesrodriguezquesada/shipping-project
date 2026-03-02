import { Module } from '@nestjs/common';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { DELIVERY_FEES_COMMAND_PORT, DELIVERY_FEES_QUERY_PORT } from 'src/shared/constants/tokens';
import { PrismaDeliveryFeesCommandAdapter } from './infrastructure/adapters/prisma-delivery-fees-command.adapter';
import { PrismaDeliveryFeesQueryAdapter } from './infrastructure/adapters/prisma-delivery-fees-query.adapter';
import { AdminCreateDeliveryFeeRuleUseCase } from './application/use-cases/admin-create-delivery-fee-rule.usecase';
import { AdminUpdateDeliveryFeeRuleUseCase } from './application/use-cases/admin-update-delivery-fee-rule.usecase';
import { AdminSetDeliveryFeeRuleEnabledUseCase } from './application/use-cases/admin-set-delivery-fee-rule-enabled.usecase';
import { AdminListDeliveryFeeRulesUseCase } from './application/use-cases/admin-list-delivery-fee-rules.usecase';
import { DeliveryFeesResolver } from './presentation/graphql/resolvers/delivery-fees.resolver';

@Module({
  imports: [CatalogsModule],
  providers: [
    PrismaDeliveryFeesCommandAdapter,
    PrismaDeliveryFeesQueryAdapter,
    { provide: DELIVERY_FEES_COMMAND_PORT, useExisting: PrismaDeliveryFeesCommandAdapter },
    { provide: DELIVERY_FEES_QUERY_PORT, useExisting: PrismaDeliveryFeesQueryAdapter },
    AdminCreateDeliveryFeeRuleUseCase,
    AdminUpdateDeliveryFeeRuleUseCase,
    AdminSetDeliveryFeeRuleEnabledUseCase,
    AdminListDeliveryFeeRulesUseCase,
    DeliveryFeesResolver,
  ],
  exports: [DELIVERY_FEES_QUERY_PORT, DELIVERY_FEES_COMMAND_PORT],
})
export class DeliveryFeesModule {}
