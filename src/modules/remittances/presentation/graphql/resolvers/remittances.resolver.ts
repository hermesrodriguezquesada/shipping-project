import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { AdminRemittancesUseCase } from 'src/modules/remittances/application/use-cases/admin-remittances.usecase';
import { GetMyRemittanceUseCase } from 'src/modules/remittances/application/use-cases/get-my-remittance.usecase';
import { ListMyRemittancesUseCase } from 'src/modules/remittances/application/use-cases/list-my-remittances.usecase';
import { RemittanceLifecycleUseCase } from 'src/modules/remittances/application/use-cases/remittance-lifecycle.usecase';
import { SubmitRemittanceV2UseCase } from 'src/modules/remittances/application/use-cases/submit-remittance-v2.usecase';
import { RemittanceReadModel } from 'src/modules/remittances/domain/ports/remittance-query.port';
import { SubmitRemittanceV2Input } from '../inputs/submit-remittance-v2.input';
import { RemittanceType } from '../types/remittance.type';

@UseGuards(GqlAuthGuard)
@Resolver()
export class RemittancesResolver {
  constructor(
    private readonly adminRemittancesUseCase: AdminRemittancesUseCase,
    private readonly remittanceLifecycleUseCase: RemittanceLifecycleUseCase,
    private readonly getMyRemittanceUseCase: GetMyRemittanceUseCase,
    private readonly listMyRemittancesUseCase: ListMyRemittancesUseCase,
    private readonly submitRemittanceV2UseCase: SubmitRemittanceV2UseCase,
  ) {}

  @Query(() => RemittanceType, { nullable: true })
  async myRemittance(
    @Args('id', { type: () => ID }) remittanceId: string,
    @CurrentUser() user: AuthContextUser,
  ): Promise<RemittanceType | null> {
    const remittance = await this.getMyRemittanceUseCase.execute({
      senderUserId: user.id,
      remittanceId,
    });

    if (!remittance) {
      return null;
    }

    return this.toRemittanceType(remittance);
  }

  @Query(() => [RemittanceType])
  async myRemittances(
    @Args('limit', { type: () => Int, nullable: true }) limit: number | undefined,
    @Args('offset', { type: () => Int, nullable: true }) offset: number | undefined,
    @CurrentUser() user: AuthContextUser,
  ): Promise<RemittanceType[]> {
    const remittances = await this.listMyRemittancesUseCase.execute({
      senderUserId: user.id,
      limit,
      offset,
    });

    return remittances.map((remittance) => this.toRemittanceType(remittance));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [RemittanceType])
  async adminRemittances(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<RemittanceType[]> {
    const remittances = await this.adminRemittancesUseCase.list({ limit, offset });
    return remittances.map((remittance) => this.toRemittanceType(remittance));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [RemittanceType])
  async adminRemittancesByUser(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<RemittanceType[]> {
    const remittances = await this.adminRemittancesUseCase.listByUser({ userId, limit, offset });
    return remittances.map((remittance) => this.toRemittanceType(remittance));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => RemittanceType, { nullable: true })
  async adminRemittance(@Args('id', { type: () => ID }) id: string): Promise<RemittanceType | null> {
    const remittance = await this.adminRemittancesUseCase.getById(id);
    return remittance ? this.toRemittanceType(remittance) : null;
  }

  @Mutation(() => RemittanceType)
  async submitRemittanceV2(
    @Args('input') input: SubmitRemittanceV2Input,
    @CurrentUser() user: AuthContextUser,
  ): Promise<RemittanceType> {
    const remittance = await this.submitRemittanceV2UseCase.execute({
      senderUserId: user.id,
      beneficiaryId: input.beneficiaryId,
      paymentAmount: input.paymentAmount,
      paymentCurrencyCode: input.paymentCurrencyCode,
      receivingCurrencyCode: input.receivingCurrencyCode,
      receptionMethod: input.receptionMethod,
      destinationCupCardNumber: input.destinationCupCardNumber,
      originAccountHolder: input.originAccountHolder,
      originAccount: input.originAccount,
      deliveryLocation: input.deliveryLocation,
    });

    return this.toRemittanceType(remittance);
  }

  @Mutation(() => Boolean)
  async markRemittancePaid(
    @Args('remittanceId', { type: () => ID }) remittanceId: string,
    @Args('paymentDetails') paymentDetails: string,
    @CurrentUser() user: AuthContextUser,
  ): Promise<boolean> {
    return this.remittanceLifecycleUseCase.markPaid({
      remittanceId,
      senderUserId: user.id,
      paymentDetails,
    });
  }

  @Mutation(() => Boolean)
  async cancelMyRemittance(
    @Args('remittanceId', { type: () => ID }) remittanceId: string,
    @CurrentUser() user: AuthContextUser,
  ): Promise<boolean> {
    return this.remittanceLifecycleUseCase.cancelMyRemittance({
      remittanceId,
      senderUserId: user.id,
    });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Boolean)
  async adminConfirmRemittancePayment(
    @Args('remittanceId', { type: () => ID }) remittanceId: string,
  ): Promise<boolean> {
    return this.remittanceLifecycleUseCase.adminConfirmRemittancePayment(remittanceId);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Boolean)
  async adminCancelRemittance(
    @Args('remittanceId', { type: () => ID }) remittanceId: string,
    @Args('statusDescription') statusDescription: string,
  ): Promise<boolean> {
    return this.remittanceLifecycleUseCase.adminCancelRemittance({
      remittanceId,
      statusDescription,
    });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Boolean)
  async adminMarkRemittanceDelivered(
    @Args('remittanceId', { type: () => ID }) remittanceId: string,
  ): Promise<boolean> {
    return this.remittanceLifecycleUseCase.adminMarkRemittanceDelivered(remittanceId);
  }


  private toRemittanceType(remittance: RemittanceReadModel): RemittanceType {
    const beneficiary = {
      id: remittance.beneficiary.id,
      fullName: remittance.beneficiary.fullName,
      phone: remittance.beneficiary.phone,
      email: remittance.beneficiary.email ?? undefined,
      country: remittance.beneficiary.country,
      city: remittance.beneficiary.city ?? undefined,
      addressLine1: remittance.beneficiary.addressLine1,
      addressLine2: remittance.beneficiary.addressLine2 ?? undefined,
      postalCode: remittance.beneficiary.postalCode ?? undefined,
      documentType: remittance.beneficiary.documentType ?? undefined,
      documentNumber: remittance.beneficiary.documentNumber,
      relationship: remittance.beneficiary.relationship ?? undefined,
      deliveryInstructions: remittance.beneficiary.deliveryInstructions ?? undefined,
      isFavorite: remittance.beneficiary.isFavorite,
      favoriteAt: remittance.beneficiary.favoriteAt ?? undefined,
      createdAt: remittance.beneficiary.createdAt,
      updatedAt: remittance.beneficiary.updatedAt,
    };

    return {
      id: remittance.id,
      status: remittance.status,
      paymentAmount: remittance.amount.toString(),
      receivingAmount: remittance.netReceivingAmount?.toString() ?? null,
      feesBreakdownJson: remittance.feesBreakdownJson,
      originZelleEmail: remittance.originZelleEmail,
      originIban: remittance.originIban,
      originStripePaymentMethodId: remittance.originStripePaymentMethodId,
      receptionMethod: remittance.receptionMethodCatalog,
      destinationCupCardNumber: remittance.destinationCupCardNumber,
      originAccountHolderType: remittance.originAccountHolderType,
      originAccountHolderFirstName: remittance.originAccountHolderFirstName,
      originAccountHolderLastName: remittance.originAccountHolderLastName,
      originAccountHolderCompanyName: remittance.originAccountHolderCompanyName,
      paymentMethod: remittance.paymentMethod,
      paymentCurrency: remittance.paymentCurrency,
      receivingCurrency: remittance.receivingCurrency,
      paymentDetails: remittance.paymentDetails,
      statusDescription: remittance.statusDescription,
      exchangeRateRateUsed: remittance.exchangeRateRateUsed?.toString() ?? null,
      beneficiary,
      createdAt: remittance.createdAt,
      updatedAt: remittance.updatedAt,
    };
  }

}
