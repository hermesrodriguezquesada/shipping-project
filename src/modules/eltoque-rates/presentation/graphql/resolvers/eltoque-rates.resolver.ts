import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { GetElToqueCurrentRatesUseCase } from 'src/modules/eltoque-rates/application/use-cases/get-eltoque-current-rates.usecase';
import { GetElToqueRatesNormalizedUseCase } from 'src/modules/eltoque-rates/application/use-cases/get-eltoque-rates-normalized.usecase';
import { GetElToqueRatesUseCase } from 'src/modules/eltoque-rates/application/use-cases/get-eltoque-rates.usecase';
import { ElToqueRateType } from '../types/eltoque-rate.type';
import { ElToqueRatesPayloadType } from '../types/eltoque-rates-payload.type';

@Resolver()
export class ElToqueRatesResolver {
  constructor(
    private readonly getElToqueRatesUseCase: GetElToqueRatesUseCase,
    private readonly getElToqueRatesNormalizedUseCase: GetElToqueRatesNormalizedUseCase,
    private readonly getElToqueCurrentRatesUseCase: GetElToqueCurrentRatesUseCase,
  ) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => String)
  async elToqueRates(
    @Args('dateFrom', { nullable: true }) dateFrom?: string,
    @Args('dateTo', { nullable: true }) dateTo?: string,
  ): Promise<string> {
    return this.getElToqueRatesUseCase.execute({ dateFrom, dateTo });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => ElToqueRatesPayloadType)
  async elToqueRatesNormalized(
    @Args('dateFrom', { nullable: true }) dateFrom?: string,
    @Args('dateTo', { nullable: true }) dateTo?: string,
  ): Promise<ElToqueRatesPayloadType> {
    return this.getElToqueRatesNormalizedUseCase.execute({ dateFrom, dateTo });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => [ElToqueRateType])
  async elToqueCurrentRates(): Promise<ElToqueRateType[]> {
    return this.getElToqueCurrentRatesUseCase.execute();
  }
}
