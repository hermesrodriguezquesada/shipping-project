import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OriginAccountHolderType, Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { AdminCreateCommissionRuleUseCase } from 'src/modules/commission-rules/application/use-cases/admin-create-commission-rule.usecase';
import { AdminListCommissionRulesUseCase } from 'src/modules/commission-rules/application/use-cases/admin-list-commission-rules.usecase';
import { AdminSetCommissionRuleEnabledUseCase } from 'src/modules/commission-rules/application/use-cases/admin-set-commission-rule-enabled.usecase';
import { AdminUpdateCommissionRuleUseCase } from 'src/modules/commission-rules/application/use-cases/admin-update-commission-rule.usecase';
import { CommissionRuleReadModel } from 'src/modules/commission-rules/domain/ports/commission-rules-query.port';
import { AdminCreateCommissionRuleInput } from '../inputs/admin-create-commission-rule.input';
import { AdminUpdateCommissionRuleInput } from '../inputs/admin-update-commission-rule.input';
import { CommissionRuleType } from '../types/commission-rule.type';

@UseGuards(GqlAuthGuard)
@Resolver()
export class CommissionRulesResolver {
  constructor(
    private readonly createUseCase: AdminCreateCommissionRuleUseCase,
    private readonly updateUseCase: AdminUpdateCommissionRuleUseCase,
    private readonly setEnabledUseCase: AdminSetCommissionRuleEnabledUseCase,
    private readonly listUseCase: AdminListCommissionRulesUseCase,
  ) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => CommissionRuleType)
  async adminCreateCommissionRule(@Args('input') input: AdminCreateCommissionRuleInput): Promise<CommissionRuleType> {
    const created = await this.createUseCase.execute(input);
    return this.toType(created);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => CommissionRuleType)
  async adminUpdateCommissionRule(@Args('input') input: AdminUpdateCommissionRuleInput): Promise<CommissionRuleType> {
    const updated = await this.updateUseCase.execute(input);
    return this.toType(updated);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => CommissionRuleType)
  async adminSetCommissionRuleEnabled(
    @Args('id', { type: () => ID }) id: string,
    @Args('enabled', { type: () => Boolean }) enabled: boolean,
  ): Promise<CommissionRuleType> {
    const updated = await this.setEnabledUseCase.execute({ id, enabled });
    return this.toType(updated);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [CommissionRuleType])
  async adminCommissionRules(
    @Args('currencyCode', { nullable: true }) currencyCode?: string,
    @Args('holderType', { type: () => OriginAccountHolderType, nullable: true }) holderType?: OriginAccountHolderType,
    @Args('enabled', { type: () => Boolean, nullable: true }) enabled?: boolean,
  ): Promise<CommissionRuleType[]> {
    const rules = await this.listUseCase.execute({ currencyCode, holderType, enabled });
    return rules.map((rule) => this.toType(rule));
  }

  private toType(rule: CommissionRuleReadModel): CommissionRuleType {
    return {
      id: rule.id,
      currency: rule.currency,
      holderType: rule.holderType,
      version: rule.version,
      thresholdAmount: rule.thresholdAmount.toString(),
      percentRate: rule.percentRate.toString(),
      flatFee: rule.flatFee.toString(),
      enabled: rule.enabled,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }
}
