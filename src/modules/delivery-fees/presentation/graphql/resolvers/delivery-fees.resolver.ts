import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { AdminCreateDeliveryFeeRuleUseCase } from 'src/modules/delivery-fees/application/use-cases/admin-create-delivery-fee-rule.usecase';
import { AdminListDeliveryFeeRulesUseCase } from 'src/modules/delivery-fees/application/use-cases/admin-list-delivery-fee-rules.usecase';
import { AdminSetDeliveryFeeRuleEnabledUseCase } from 'src/modules/delivery-fees/application/use-cases/admin-set-delivery-fee-rule-enabled.usecase';
import { AdminUpdateDeliveryFeeRuleUseCase } from 'src/modules/delivery-fees/application/use-cases/admin-update-delivery-fee-rule.usecase';
import { DeliveryFeeRuleReadModel } from 'src/modules/delivery-fees/domain/ports/delivery-fees-query.port';
import { AdminCreateDeliveryFeeRuleInput } from '../inputs/admin-create-delivery-fee-rule.input';
import { AdminUpdateDeliveryFeeRuleInput } from '../inputs/admin-update-delivery-fee-rule.input';
import { DeliveryFeeRuleType } from '../types/delivery-fee-rule.type';

@UseGuards(GqlAuthGuard)
@Resolver()
export class DeliveryFeesResolver {
  constructor(
    private readonly createUseCase: AdminCreateDeliveryFeeRuleUseCase,
    private readonly updateUseCase: AdminUpdateDeliveryFeeRuleUseCase,
    private readonly setEnabledUseCase: AdminSetDeliveryFeeRuleEnabledUseCase,
    private readonly listUseCase: AdminListDeliveryFeeRulesUseCase,
  ) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => DeliveryFeeRuleType)
  async adminCreateDeliveryFeeRule(@Args('input') input: AdminCreateDeliveryFeeRuleInput): Promise<DeliveryFeeRuleType> {
    const created = await this.createUseCase.execute(input);
    return this.toType(created);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => DeliveryFeeRuleType)
  async adminUpdateDeliveryFeeRule(@Args('input') input: AdminUpdateDeliveryFeeRuleInput): Promise<DeliveryFeeRuleType> {
    const updated = await this.updateUseCase.execute(input);
    return this.toType(updated);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => DeliveryFeeRuleType)
  async adminSetDeliveryFeeRuleEnabled(
    @Args('id', { type: () => ID }) id: string,
    @Args('enabled', { type: () => Boolean }) enabled: boolean,
  ): Promise<DeliveryFeeRuleType> {
    const updated = await this.setEnabledUseCase.execute({ id, enabled });
    return this.toType(updated);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [DeliveryFeeRuleType])
  async adminDeliveryFeeRules(
    @Args('currencyCode', { nullable: true }) currencyCode?: string,
    @Args('country', { nullable: true }) country?: string,
    @Args('enabled', { type: () => Boolean, nullable: true }) enabled?: boolean,
  ): Promise<DeliveryFeeRuleType[]> {
    const rules = await this.listUseCase.execute({ currencyCode, country, enabled });
    return rules.map((rule) => this.toType(rule));
  }

  private toType(rule: DeliveryFeeRuleReadModel): DeliveryFeeRuleType {
    return {
      id: rule.id,
      currency: rule.currency,
      country: rule.country,
      region: rule.region,
      city: rule.city,
      amount: rule.amount.toString(),
      enabled: rule.enabled,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }
}
