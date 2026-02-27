import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { AdminCreateCurrencyUseCase } from 'src/modules/catalogs/application/use-cases/admin-create-currency.usecase';
import { AdminSetCurrencyEnabledUseCase } from 'src/modules/catalogs/application/use-cases/admin-set-currency-enabled.usecase';
import { AdminSetPaymentMethodEnabledUseCase } from 'src/modules/catalogs/application/use-cases/admin-set-payment-method-enabled.usecase';
import { AdminSetReceptionMethodEnabledUseCase } from 'src/modules/catalogs/application/use-cases/admin-set-reception-method-enabled.usecase';
import { AdminUpdateCurrencyUseCase } from 'src/modules/catalogs/application/use-cases/admin-update-currency.usecase';
import { AdminUpdatePaymentMethodDescriptionUseCase } from 'src/modules/catalogs/application/use-cases/admin-update-payment-method-description.usecase';
import { AdminUpdateReceptionMethodDescriptionUseCase } from 'src/modules/catalogs/application/use-cases/admin-update-reception-method-description.usecase';
import { ListCurrenciesUseCase } from 'src/modules/catalogs/application/use-cases/list-currencies.usecase';
import { ListPaymentMethodsUseCase } from 'src/modules/catalogs/application/use-cases/list-payment-methods.usecase';
import { ListReceptionMethodsUseCase } from 'src/modules/catalogs/application/use-cases/list-reception-methods.usecase';
import { AdminCreateCurrencyInput } from '../inputs/admin-create-currency.input';
import { AdminUpdateCurrencyInput } from '../inputs/admin-update-currency.input';
import { CurrencyCatalogType } from '../types/currency-catalog.type';
import { PaymentMethodType } from '../types/payment-method.type';
import { ReceptionMethodType } from '../types/reception-method.type';

@UseGuards(GqlAuthGuard)
@Resolver()
export class CatalogsResolver {
  constructor(
    private readonly listPaymentMethodsUseCase: ListPaymentMethodsUseCase,
    private readonly listReceptionMethodsUseCase: ListReceptionMethodsUseCase,
    private readonly listCurrenciesUseCase: ListCurrenciesUseCase,
    private readonly adminUpdatePaymentMethodDescriptionUseCase: AdminUpdatePaymentMethodDescriptionUseCase,
    private readonly adminSetPaymentMethodEnabledUseCase: AdminSetPaymentMethodEnabledUseCase,
    private readonly adminUpdateReceptionMethodDescriptionUseCase: AdminUpdateReceptionMethodDescriptionUseCase,
    private readonly adminSetReceptionMethodEnabledUseCase: AdminSetReceptionMethodEnabledUseCase,
    private readonly adminCreateCurrencyUseCase: AdminCreateCurrencyUseCase,
    private readonly adminUpdateCurrencyUseCase: AdminUpdateCurrencyUseCase,
    private readonly adminSetCurrencyEnabledUseCase: AdminSetCurrencyEnabledUseCase,
  ) {}

  @Query(() => [PaymentMethodType])
  async paymentMethods(
    @Args('enabledOnly', { type: () => Boolean, nullable: true }) enabledOnly?: boolean,
  ): Promise<PaymentMethodType[]> {
    return this.listPaymentMethodsUseCase.execute(enabledOnly ?? true);
  }

  @Query(() => [ReceptionMethodType])
  async receptionMethods(
    @Args('enabledOnly', { type: () => Boolean, nullable: true }) enabledOnly?: boolean,
  ): Promise<ReceptionMethodType[]> {
    return this.listReceptionMethodsUseCase.execute(enabledOnly ?? true);
  }

  @Query(() => [CurrencyCatalogType])
  async currencies(
    @Args('enabledOnly', { type: () => Boolean, nullable: true }) enabledOnly?: boolean,
  ): Promise<CurrencyCatalogType[]> {
    return this.listCurrenciesUseCase.execute(enabledOnly ?? true);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => PaymentMethodType)
  async adminUpdatePaymentMethodDescription(
    @Args('code') code: string,
    @Args('description', { nullable: true }) description?: string,
  ): Promise<PaymentMethodType> {
    return this.adminUpdatePaymentMethodDescriptionUseCase.execute({ code, description });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => PaymentMethodType)
  async adminSetPaymentMethodEnabled(
    @Args('code') code: string,
    @Args('enabled', { type: () => Boolean }) enabled: boolean,
  ): Promise<PaymentMethodType> {
    return this.adminSetPaymentMethodEnabledUseCase.execute({ code, enabled });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => ReceptionMethodType)
  async adminUpdateReceptionMethodDescription(
    @Args('code') code: string,
    @Args('description', { nullable: true }) description?: string,
  ): Promise<ReceptionMethodType> {
    return this.adminUpdateReceptionMethodDescriptionUseCase.execute({ code, description });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => ReceptionMethodType)
  async adminSetReceptionMethodEnabled(
    @Args('code') code: string,
    @Args('enabled', { type: () => Boolean }) enabled: boolean,
  ): Promise<ReceptionMethodType> {
    return this.adminSetReceptionMethodEnabledUseCase.execute({ code, enabled });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => CurrencyCatalogType)
  async adminCreateCurrency(@Args('input') input: AdminCreateCurrencyInput): Promise<CurrencyCatalogType> {
    return this.adminCreateCurrencyUseCase.execute(input);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => CurrencyCatalogType)
  async adminUpdateCurrency(@Args('input') input: AdminUpdateCurrencyInput): Promise<CurrencyCatalogType> {
    return this.adminUpdateCurrencyUseCase.execute(input);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => CurrencyCatalogType)
  async adminSetCurrencyEnabled(
    @Args('code') code: string,
    @Args('enabled', { type: () => Boolean }) enabled: boolean,
  ): Promise<CurrencyCatalogType> {
    return this.adminSetCurrencyEnabledUseCase.execute({ code, enabled });
  }
}
