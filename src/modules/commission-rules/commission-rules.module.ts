import { Module } from '@nestjs/common';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { COMMISSION_RULES_COMMAND_PORT, COMMISSION_RULES_QUERY_PORT } from 'src/shared/constants/tokens';
import { PrismaCommissionRulesCommandAdapter } from './infrastructure/adapters/prisma-commission-rules-command.adapter';
import { PrismaCommissionRulesQueryAdapter } from './infrastructure/adapters/prisma-commission-rules-query.adapter';
import { AdminCreateCommissionRuleUseCase } from './application/use-cases/admin-create-commission-rule.usecase';
import { AdminUpdateCommissionRuleUseCase } from './application/use-cases/admin-update-commission-rule.usecase';
import { AdminSetCommissionRuleEnabledUseCase } from './application/use-cases/admin-set-commission-rule-enabled.usecase';
import { AdminListCommissionRulesUseCase } from './application/use-cases/admin-list-commission-rules.usecase';
import { CommissionRulesResolver } from './presentation/graphql/resolvers/commission-rules.resolver';

@Module({
  imports: [CatalogsModule],
  providers: [
    PrismaCommissionRulesCommandAdapter,
    PrismaCommissionRulesQueryAdapter,
    { provide: COMMISSION_RULES_COMMAND_PORT, useExisting: PrismaCommissionRulesCommandAdapter },
    { provide: COMMISSION_RULES_QUERY_PORT, useExisting: PrismaCommissionRulesQueryAdapter },
    AdminCreateCommissionRuleUseCase,
    AdminUpdateCommissionRuleUseCase,
    AdminSetCommissionRuleEnabledUseCase,
    AdminListCommissionRulesUseCase,
    CommissionRulesResolver,
  ],
  exports: [COMMISSION_RULES_QUERY_PORT, COMMISSION_RULES_COMMAND_PORT],
})
export class CommissionRulesModule {}
