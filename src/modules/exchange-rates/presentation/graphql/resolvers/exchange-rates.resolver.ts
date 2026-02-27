import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { AdminCreateExchangeRateUseCase } from 'src/modules/exchange-rates/application/use-cases/admin-create-exchange-rate.usecase';
import { AdminDeleteExchangeRateUseCase } from 'src/modules/exchange-rates/application/use-cases/admin-delete-exchange-rate.usecase';
import { AdminListExchangeRatesUseCase } from 'src/modules/exchange-rates/application/use-cases/admin-list-exchange-rates.usecase';
import { AdminUpdateExchangeRateUseCase } from 'src/modules/exchange-rates/application/use-cases/admin-update-exchange-rate.usecase';
import { GetLatestExchangeRateUseCase } from 'src/modules/exchange-rates/application/use-cases/get-latest-exchange-rate.usecase';
import { ExchangeRateReadModel } from 'src/modules/exchange-rates/domain/ports/exchange-rates-query.port';
import { AdminCreateExchangeRateInput } from '../inputs/admin-create-exchange-rate.input';
import { AdminUpdateExchangeRateInput } from '../inputs/admin-update-exchange-rate.input';
import { ExchangeRateType } from '../types/exchange-rate.type';

@UseGuards(GqlAuthGuard)
@Resolver()
export class ExchangeRatesResolver {
  constructor(
    private readonly getLatestExchangeRateUseCase: GetLatestExchangeRateUseCase,
    private readonly adminListExchangeRatesUseCase: AdminListExchangeRatesUseCase,
    private readonly adminCreateExchangeRateUseCase: AdminCreateExchangeRateUseCase,
    private readonly adminUpdateExchangeRateUseCase: AdminUpdateExchangeRateUseCase,
    private readonly adminDeleteExchangeRateUseCase: AdminDeleteExchangeRateUseCase,
  ) {}

  @Query(() => ExchangeRateType, { nullable: true })
  async exchangeRate(
    @Args('from') from: string,
    @Args('to') to: string,
  ): Promise<ExchangeRateType | null> {
    const rate = await this.getLatestExchangeRateUseCase.execute(from, to);
    return rate ? this.toExchangeRateType(rate) : null;
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [ExchangeRateType])
  async adminExchangeRates(
    @Args('from', { nullable: true }) from?: string,
    @Args('to', { nullable: true }) to?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<ExchangeRateType[]> {
    const rates = await this.adminListExchangeRatesUseCase.execute({ from, to, limit, offset });
    return rates.map((rate) => this.toExchangeRateType(rate));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => ExchangeRateType)
  async adminCreateExchangeRate(@Args('input') input: AdminCreateExchangeRateInput): Promise<ExchangeRateType> {
    const created = await this.adminCreateExchangeRateUseCase.execute(input);
    return this.toExchangeRateType(created);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => ExchangeRateType)
  async adminUpdateExchangeRate(@Args('input') input: AdminUpdateExchangeRateInput): Promise<ExchangeRateType> {
    const updated = await this.adminUpdateExchangeRateUseCase.execute(input);
    return this.toExchangeRateType(updated);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Boolean)
  async adminDeleteExchangeRate(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.adminDeleteExchangeRateUseCase.execute(id);
  }

  private toExchangeRateType(rate: ExchangeRateReadModel): ExchangeRateType {
    return {
      id: rate.id,
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: rate.rate.toString(),
      enabled: rate.enabled,
      createdAt: rate.createdAt,
      updatedAt: rate.updatedAt,
    };
  }
}
