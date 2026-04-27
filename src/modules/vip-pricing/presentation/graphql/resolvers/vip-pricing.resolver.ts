import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { AdminCreateVipExchangeRateUseCase } from 'src/modules/vip-pricing/application/use-cases/admin-create-vip-exchange-rate.usecase';
import { AdminListVipExchangeRatesUseCase } from 'src/modules/vip-pricing/application/use-cases/admin-list-vip-exchange-rates.usecase';
import { AdminSetVipExchangeRateEnabledUseCase } from 'src/modules/vip-pricing/application/use-cases/admin-set-vip-exchange-rate-enabled.usecase';
import { AdminUpdateVipExchangeRateUseCase } from 'src/modules/vip-pricing/application/use-cases/admin-update-vip-exchange-rate.usecase';
import { VipProfitPreviewUseCase } from 'src/modules/vip-pricing/application/use-cases/vip-profit-preview.usecase';
import { VipExchangeRateMapper } from '../mappers/vip-exchange-rate.mapper';
import { AdminCreateVipExchangeRateInput } from '../inputs/admin-create-vip-exchange-rate.input';
import { AdminUpdateVipExchangeRateInput } from '../inputs/admin-update-vip-exchange-rate.input';
import { AdminVipExchangeRatesInput } from '../inputs/admin-vip-exchange-rates.input';
import { VipProfitPreviewInput } from '../inputs/vip-profit-preview.input';
import { VipExchangeRateType } from '../types/vip-exchange-rate.type';
import { VipProfitPreviewType } from '../types/vip-profit-preview.type';

@Resolver()
export class VipPricingResolver {
  constructor(
    private readonly adminCreateVipExchangeRateUseCase: AdminCreateVipExchangeRateUseCase,
    private readonly adminUpdateVipExchangeRateUseCase: AdminUpdateVipExchangeRateUseCase,
    private readonly adminSetVipExchangeRateEnabledUseCase: AdminSetVipExchangeRateEnabledUseCase,
    private readonly adminListVipExchangeRatesUseCase: AdminListVipExchangeRatesUseCase,
    private readonly vipProfitPreviewUseCase: VipProfitPreviewUseCase,
  ) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Mutation(() => VipExchangeRateType, { name: 'adminCreateVipExchangeRate' })
  async adminCreateVipExchangeRate(
    @Args('input') input: AdminCreateVipExchangeRateInput,
  ): Promise<VipExchangeRateType> {
    const created = await this.adminCreateVipExchangeRateUseCase.execute(input);
    return VipExchangeRateMapper.toGraphQL(created);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Mutation(() => VipExchangeRateType, { name: 'adminUpdateVipExchangeRate' })
  async adminUpdateVipExchangeRate(
    @Args('input') input: AdminUpdateVipExchangeRateInput,
  ): Promise<VipExchangeRateType> {
    const updated = await this.adminUpdateVipExchangeRateUseCase.execute(input);
    return VipExchangeRateMapper.toGraphQL(updated);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Mutation(() => VipExchangeRateType, { name: 'adminSetVipExchangeRateEnabled' })
  async adminSetVipExchangeRateEnabled(
    @Args('id', { type: () => ID }) id: string,
    @Args('enabled', { type: () => Boolean }) enabled: boolean,
  ): Promise<VipExchangeRateType> {
    const updated = await this.adminSetVipExchangeRateEnabledUseCase.execute({ id, enabled });
    return VipExchangeRateMapper.toGraphQL(updated);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => [VipExchangeRateType], { name: 'adminVipExchangeRates' })
  async adminVipExchangeRates(
    @Args('input', { type: () => AdminVipExchangeRatesInput, nullable: true }) input?: AdminVipExchangeRatesInput,
  ): Promise<VipExchangeRateType[]> {
    const rows = await this.adminListVipExchangeRatesUseCase.execute({
      fromCurrencyCode: input?.fromCurrencyCode,
      toCurrencyCode: input?.toCurrencyCode,
      enabled: input?.enabled,
      limit: input?.limit,
      offset: input?.offset,
    });

    return rows.map(VipExchangeRateMapper.toGraphQL);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => VipProfitPreviewType, { name: 'vipProfitPreview' })
  async vipProfitPreview(
    @Args('input') input: VipProfitPreviewInput,
    @CurrentUser() user: AuthContextUser,
  ): Promise<VipProfitPreviewType> {
    const result = await this.vipProfitPreviewUseCase.execute({
      userId: user.id,
      paymentAmount: input.paymentAmount,
      fromCurrencyCode: input.fromCurrencyCode,
      toCurrencyCode: input.toCurrencyCode,
    });

    return {
      paymentAmount: result.paymentAmount.toString(),
      fromCurrencyCode: result.fromCurrencyCode,
      toCurrencyCode: result.toCurrencyCode,
      baseRate: result.baseRate.toString(),
      vipRate: result.vipRate.toString(),
      rateDifference: result.rateDifference.toString(),
      vipProfitAmount: result.vipProfitAmount.toString(),
      profitCurrencyCode: result.profitCurrencyCode,
    };
  }
}