import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { GetElToqueRatesUseCase } from 'src/modules/eltoque-rates/application/use-cases/get-eltoque-rates.usecase';

@Resolver()
export class ElToqueRatesResolver {
  constructor(private readonly getElToqueRatesUseCase: GetElToqueRatesUseCase) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => String)
  async elToqueRates(
    @Args('dateFrom', { nullable: true }) dateFrom?: string,
    @Args('dateTo', { nullable: true }) dateTo?: string,
  ): Promise<string> {
    return this.getElToqueRatesUseCase.execute({ dateFrom, dateTo });
  }
}
