import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { AdminRemittancesUseCase } from 'src/modules/remittances/application/use-cases/admin-remittances.usecase';
import { CreateRemittanceDraftV2UseCase } from 'src/modules/remittances/application/use-cases/create-remittance-draft-v2.usecase';
import { CreateRemittanceDraftUseCase } from 'src/modules/remittances/application/use-cases/create-remittance-draft.usecase';
import { GetMyRemittanceUseCase } from 'src/modules/remittances/application/use-cases/get-my-remittance.usecase';
import { ListMyRemittancesUseCase } from 'src/modules/remittances/application/use-cases/list-my-remittances.usecase';
import { RemittanceLifecycleUseCase } from 'src/modules/remittances/application/use-cases/remittance-lifecycle.usecase';
import { SetRemittanceAmountUseCase } from 'src/modules/remittances/application/use-cases/set-remittance-amount.usecase';
import { SetRemittanceDestinationCupCardUseCase } from 'src/modules/remittances/application/use-cases/set-remittance-destination-cup-card.usecase';
import { SetRemittanceOriginAccountHolderUseCase } from 'src/modules/remittances/application/use-cases/set-remittance-origin-account-holder.usecase';
import { SetRemittanceOriginAccountUseCase } from 'src/modules/remittances/application/use-cases/set-remittance-origin-account.usecase';
import { SetRemittanceReceptionMethodUseCase } from 'src/modules/remittances/application/use-cases/set-remittance-reception-method.usecase';
import { SetRemittanceReceivingCurrencyUseCase } from 'src/modules/remittances/application/use-cases/set-remittance-receiving-currency.usecase';
import { SubmitRemittanceUseCase } from 'src/modules/remittances/application/use-cases/submit-remittance.usecase';
import { RemittanceReadModel } from 'src/modules/remittances/domain/ports/remittance-query.port';
import { CreateRemittanceDraftInput } from '../inputs/create-remittance-draft.input';
import { SetRemittanceAmountInput } from '../inputs/set-remittance-amount.input';
import { SetRemittanceDestinationCupCardInput } from '../inputs/set-remittance-destination-cup-card.input';
import { SetRemittanceOriginAccountHolderInput } from '../inputs/set-remittance-origin-account-holder.input';
import { SetRemittanceOriginAccountInput } from '../inputs/set-remittance-origin-account.input';
import { SetRemittanceReceptionMethodInput } from '../inputs/set-remittance-reception-method.input';
import { SetRemittanceReceivingCurrencyInput } from '../inputs/set-remittance-receiving-currency.input';
import { RemittanceType } from '../types/remittance.type';

@UseGuards(GqlAuthGuard)
@Resolver()
export class RemittancesResolver {
  constructor(
    private readonly createDraft: CreateRemittanceDraftUseCase,
    private readonly createDraftV2: CreateRemittanceDraftV2UseCase,
    private readonly adminRemittancesUseCase: AdminRemittancesUseCase,
    private readonly remittanceLifecycleUseCase: RemittanceLifecycleUseCase,
    private readonly getMyRemittanceUseCase: GetMyRemittanceUseCase,
    private readonly listMyRemittancesUseCase: ListMyRemittancesUseCase,
    private readonly setOriginAccount: SetRemittanceOriginAccountUseCase,
    private readonly setAmount: SetRemittanceAmountUseCase,
    private readonly setReceptionMethod: SetRemittanceReceptionMethodUseCase,
    private readonly setDestinationCupCard: SetRemittanceDestinationCupCardUseCase,
    private readonly setOriginAccountHolder: SetRemittanceOriginAccountHolderUseCase,
    private readonly setReceivingCurrency: SetRemittanceReceivingCurrencyUseCase,
    private readonly submitRemittanceUseCase: SubmitRemittanceUseCase,
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

  @Mutation(() => ID)
  async createRemittanceDraft(
    @Args('beneficiaryId', { type: () => ID }) beneficiaryId: string,
    @CurrentUser() user: AuthContextUser,
  ): Promise<string> {
    return this.createDraft.execute({
      senderUserId: user.id,
      beneficiaryId,
    });
  }

  @Mutation(() => RemittanceType)
  async createRemittanceDraftV2(
    @Args('input') input: CreateRemittanceDraftInput,
    @CurrentUser() user: AuthContextUser,
  ): Promise<RemittanceType> {
    const remittance = await this.createDraftV2.execute({
      senderUserId: user.id,
      beneficiaryId: input.beneficiaryId,
    });

    return this.toRemittanceType(remittance);
  }

  @Mutation(() => Boolean)
  async setRemittanceOriginAccount(
    @Args('input') input: SetRemittanceOriginAccountInput,
    @CurrentUser() user: AuthContextUser,
  ): Promise<boolean> {
    return this.setOriginAccount.execute({
      remittanceId: input.remittanceId,
      senderUserId: user.id,
      originAccountType: input.originAccountType,
      zelleEmail: input.zelleEmail,
      iban: input.iban,
      stripePaymentMethodId: input.stripePaymentMethodId,
    });
  }

  @Mutation(() => Boolean)
  async setRemittanceAmount(
    @Args('input') input: SetRemittanceAmountInput,
    @CurrentUser() user: AuthContextUser,
  ): Promise<boolean> {
    return this.setAmount.execute({
      remittanceId: input.remittanceId,
      senderUserId: user.id,
      amount: input.amount,
    });
  }

  @Mutation(() => Boolean)
  async setRemittanceReceptionMethod(
    @Args('input') input: SetRemittanceReceptionMethodInput,
    @CurrentUser() user: AuthContextUser,
  ): Promise<boolean> {
    return this.setReceptionMethod.execute({
      remittanceId: input.remittanceId,
      senderUserId: user.id,
      receptionMethod: input.receptionMethod,
    });
  }

  @Mutation(() => Boolean)
  async setRemittanceDestinationCupCard(
    @Args('input') input: SetRemittanceDestinationCupCardInput,
    @CurrentUser() user: AuthContextUser,
  ): Promise<boolean> {
    return this.setDestinationCupCard.execute({
      remittanceId: input.remittanceId,
      senderUserId: user.id,
      destinationCupCardNumber: input.destinationCupCardNumber,
    });
  }

  @Mutation(() => Boolean)
  async setRemittanceOriginAccountHolder(
    @Args('input') input: SetRemittanceOriginAccountHolderInput,
    @CurrentUser() user: AuthContextUser,
  ): Promise<boolean> {
    return this.setOriginAccountHolder.execute({
      remittanceId: input.remittanceId,
      senderUserId: user.id,
      holderType: input.holderType,
      firstName: input.firstName,
      lastName: input.lastName,
      companyName: input.companyName,
    });
  }

  @Mutation(() => Boolean)
  async setRemittanceReceivingCurrency(
    @Args('input') input: SetRemittanceReceivingCurrencyInput,
    @CurrentUser() user: AuthContextUser,
  ): Promise<boolean> {
    return this.setReceivingCurrency.execute({
      remittanceId: input.remittanceId,
      senderUserId: user.id,
      currencyCode: input.currencyCode,
    });
  }

  @Mutation(() => Boolean)
  async submitRemittance(
    @Args('remittanceId', { type: () => ID }) remittanceId: string,
    @CurrentUser() user: AuthContextUser,
  ): Promise<boolean> {
    return this.submitRemittanceUseCase.execute({
      remittanceId,
      senderUserId: user.id,
    });
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
      amount: remittance.amount.toString(),
      currency: remittance.paymentCurrency,
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
      receptionMethodCatalog: remittance.receptionMethodCatalog,
      paymentCurrency: remittance.paymentCurrency,
      receivingCurrency: remittance.receivingCurrency,
      paymentMethodCode: remittance.paymentMethodCode,
      receptionMethodCode: remittance.receptionMethodCode,
      paymentDetails: remittance.paymentDetails,
      statusDescription: remittance.statusDescription,
      exchangeRateRateUsed: remittance.exchangeRateRateUsed?.toString() ?? null,
      exchangeRateUsedAt: remittance.exchangeRateUsedAt,
      beneficiary,
      transfer: remittance.transfer,
      createdAt: remittance.createdAt,
      updatedAt: remittance.updatedAt,
    };
  }

}
