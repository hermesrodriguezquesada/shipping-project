import { Logger, UseGuards } from '@nestjs/common';
import { Args, Context, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role, UserActionLogAction } from '@prisma/client';
import { Request } from 'express';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { ActiveUserGuard } from 'src/core/auth/active-user.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { AdminCreateExchangeRateUseCase } from 'src/modules/exchange-rates/application/use-cases/admin-create-exchange-rate.usecase';
import { AdminDeleteExchangeRateUseCase } from 'src/modules/exchange-rates/application/use-cases/admin-delete-exchange-rate.usecase';
import { AdminListExchangeRatesUseCase } from 'src/modules/exchange-rates/application/use-cases/admin-list-exchange-rates.usecase';
import { AdminUpdateExchangeRateUseCase } from 'src/modules/exchange-rates/application/use-cases/admin-update-exchange-rate.usecase';
import { GetLatestExchangeRateUseCase } from 'src/modules/exchange-rates/application/use-cases/get-latest-exchange-rate.usecase';
import { ListExchangeRatesPublicUseCase } from 'src/modules/exchange-rates/application/use-cases/list-exchange-rates-public.usecase';
import { ExchangeRateReadModel } from 'src/modules/exchange-rates/domain/ports/exchange-rates-query.port';
import { AdminCreateExchangeRateInput } from '../inputs/admin-create-exchange-rate.input';
import { AdminUpdateExchangeRateInput } from '../inputs/admin-update-exchange-rate.input';
import { ExchangeRateType } from '../types/exchange-rate.type';
import { RecordUserActionLogUseCase } from 'src/modules/user-action-logs/application/use-cases/record-user-action-log.usecase';
import { recordUserActionLogSafe } from 'src/modules/user-action-logs/application/utils/record-user-action-log-safe';
import { getPrimaryRole, getRequestAuditContext } from 'src/modules/user-action-logs/application/utils/user-action-log-context';

@Resolver()
export class ExchangeRatesResolver {
  private readonly logger = new Logger(ExchangeRatesResolver.name);

  constructor(
    private readonly getLatestExchangeRateUseCase: GetLatestExchangeRateUseCase,
    private readonly listExchangeRatesPublicUseCase: ListExchangeRatesPublicUseCase,
    private readonly adminListExchangeRatesUseCase: AdminListExchangeRatesUseCase,
    private readonly adminCreateExchangeRateUseCase: AdminCreateExchangeRateUseCase,
    private readonly adminUpdateExchangeRateUseCase: AdminUpdateExchangeRateUseCase,
    private readonly adminDeleteExchangeRateUseCase: AdminDeleteExchangeRateUseCase,
    private readonly recordUserActionLog: RecordUserActionLogUseCase,
  ) {}

  @Query(() => ExchangeRateType, { nullable: true })
  async exchangeRate(
    @Args('from') from: string,
    @Args('to') to: string,
  ): Promise<ExchangeRateType | null> {
    const rate = await this.getLatestExchangeRateUseCase.execute(from, to);
    return rate ? this.toExchangeRateType(rate) : null;
  }

  @Query(() => [ExchangeRateType])
  async exchangeRates(
    @Args('from', { nullable: true }) from?: string,
    @Args('to', { nullable: true }) to?: string,
    @Args('enabledOnly', { type: () => Boolean, defaultValue: true }) enabledOnly?: boolean,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<ExchangeRateType[]> {
    const rates = await this.listExchangeRatesPublicUseCase.execute({ from, to, enabledOnly, limit, offset });
    return rates.map((rate) => this.toExchangeRateType(rate));
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

  @UseGuards(GqlAuthGuard, RolesGuard, ActiveUserGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => ExchangeRateType)
  async adminCreateExchangeRate(
    @Args('input') input: AdminCreateExchangeRateInput,
    @CurrentUser() authUser: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<ExchangeRateType> {
    const created = await this.adminCreateExchangeRateUseCase.execute(input);

    await recordUserActionLogSafe(this.logger, this.recordUserActionLog, {
      actorUserId: authUser.id,
      actorEmail: authUser.email,
      actorRole: getPrimaryRole(authUser.roles),
      action: UserActionLogAction.ADMIN_CREATE_EXCHANGE_RATE,
      resourceType: 'EXCHANGE_RATE',
      resourceId: created.id,
      description: 'Administrador creó tasa de cambio',
      metadata: { fromCurrencyCode: created.fromCurrency.code, toCurrencyCode: created.toCurrency.code },
      ...getRequestAuditContext(req),
    });

    return this.toExchangeRateType(created);
  }

  @UseGuards(GqlAuthGuard, RolesGuard, ActiveUserGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => ExchangeRateType)
  async adminUpdateExchangeRate(
    @Args('input') input: AdminUpdateExchangeRateInput,
    @CurrentUser() authUser: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<ExchangeRateType> {
    const updated = await this.adminUpdateExchangeRateUseCase.execute(input);

    await recordUserActionLogSafe(this.logger, this.recordUserActionLog, {
      actorUserId: authUser.id,
      actorEmail: authUser.email,
      actorRole: getPrimaryRole(authUser.roles),
      action: UserActionLogAction.ADMIN_UPDATE_EXCHANGE_RATE,
      resourceType: 'EXCHANGE_RATE',
      resourceId: updated.id,
      description: 'Administrador actualizó tasa de cambio',
      metadata: { fromCurrencyCode: updated.fromCurrency.code, toCurrencyCode: updated.toCurrency.code },
      ...getRequestAuditContext(req),
    });

    return this.toExchangeRateType(updated);
  }

  @UseGuards(GqlAuthGuard, RolesGuard, ActiveUserGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Boolean)
  async adminDeleteExchangeRate(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() authUser: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<boolean> {
    const result = await this.adminDeleteExchangeRateUseCase.execute(id);

    await recordUserActionLogSafe(this.logger, this.recordUserActionLog, {
      actorUserId: authUser.id,
      actorEmail: authUser.email,
      actorRole: getPrimaryRole(authUser.roles),
      action: UserActionLogAction.ADMIN_DELETE_EXCHANGE_RATE,
      resourceType: 'EXCHANGE_RATE',
      resourceId: id,
      description: 'Administrador eliminó tasa de cambio',
      ...getRequestAuditContext(req),
    });

    return result;
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
