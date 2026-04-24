import { Logger, UseGuards } from '@nestjs/common';
import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role, UserActionLogAction } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../../../../../core/auth/roles.decorator';
import { RolesGuard } from '../../../../../core/auth/roles.guard';
import { CurrentUser } from '../../../../auth/presentation/graphql/decorators/current-user.decorator';
import { GqlAuthGuard } from '../../../../auth/presentation/graphql/guards/gql-auth.guard';
import { AuthContextUser } from '../../../../auth/presentation/graphql/types/auth-context-user.type';
import { AdminCancelVipPaymentProofUseCase } from '../../../application/use-cases/admin-cancel-vip-payment-proof.usecase';
import { AdminConfirmVipPaymentProofUseCase } from '../../../application/use-cases/admin-confirm-vip-payment-proof.usecase';
import { AdminListVipPaymentProofsUseCase } from '../../../application/use-cases/admin-list-vip-payment-proofs.usecase';
import { CreateVipPaymentProofUseCase } from '../../../application/use-cases/create-vip-payment-proof.usecase';
import { GetVipPaymentProofViewUrlUseCase } from '../../../application/use-cases/get-vip-payment-proof-view-url.usecase';
import { ListMyVipPaymentProofsUseCase } from '../../../application/use-cases/list-my-vip-payment-proofs.usecase';
import { VipPaymentProofMapper } from '../../mappers/vip-payment-proof.mapper';
import { AdminVipPaymentProofListInput } from '../inputs/admin-vip-payment-proof-list.input';
import { CreateVipPaymentProofInput } from '../inputs/create-vip-payment-proof.input';
import { VipPaymentProofListInput } from '../inputs/vip-payment-proof-list.input';
import { VipPaymentProofType } from '../types/vip-payment-proof.type';
import { VipPaymentProofViewPayload } from '../types/vip-payment-proof-view.payload';
import { RecordUserActionLogUseCase } from 'src/modules/user-action-logs/application/use-cases/record-user-action-log.usecase';
import { recordUserActionLogSafe } from 'src/modules/user-action-logs/application/utils/record-user-action-log-safe';
import { getPrimaryRole, getRequestAuditContext } from 'src/modules/user-action-logs/application/utils/user-action-log-context';

@Resolver(() => VipPaymentProofType)
export class VipPaymentProofsResolver {
  private readonly logger = new Logger(VipPaymentProofsResolver.name);

  constructor(
    private readonly createUseCase: CreateVipPaymentProofUseCase,
    private readonly listMineUseCase: ListMyVipPaymentProofsUseCase,
    private readonly listAdminUseCase: AdminListVipPaymentProofsUseCase,
    private readonly confirmUseCase: AdminConfirmVipPaymentProofUseCase,
    private readonly cancelUseCase: AdminCancelVipPaymentProofUseCase,
    private readonly getViewUrlUseCase: GetVipPaymentProofViewUrlUseCase,
    private readonly recordUserActionLogUseCase: RecordUserActionLogUseCase,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => VipPaymentProofType)
  async createVipPaymentProof(
    @Args('input') input: CreateVipPaymentProofInput,
    @CurrentUser() user: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<VipPaymentProofType> {
    const created = await this.createUseCase.execute({
      userId: user.id,
      accountHolderName: input.accountHolderName,
      amount: input.amount,
      currencyId: input.currencyId,
      paymentProofImg: input.paymentProofImg,
    });

    await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: getPrimaryRole(user.roles),
      action: UserActionLogAction.CREATE_VIP_PAYMENT_PROOF,
      resourceType: 'VIP_PAYMENT_PROOF',
      resourceId: created.id,
      description: 'VIP payment proof created',
      metadata: {
        amount: input.amount,
        currencyId: input.currencyId,
        hasPaymentProofImage: Boolean(input.paymentProofImg),
      },
      ...getRequestAuditContext(req),
    });

    return VipPaymentProofMapper.toGraphQL(created);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [VipPaymentProofType])
  async myVipPaymentProofs(
    @CurrentUser() user: AuthContextUser,
    @Args('input', { type: () => VipPaymentProofListInput, nullable: true }) input?: VipPaymentProofListInput,
  ): Promise<VipPaymentProofType[]> {
    const rows = await this.listMineUseCase.execute({
      userId: user.id,
      status: input?.status,
      currencyId: input?.currencyId,
      dateFrom: input?.dateFrom,
      dateTo: input?.dateTo,
      offset: input?.offset,
      limit: input?.limit,
    });

    return rows.map(VipPaymentProofMapper.toGraphQL);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => [VipPaymentProofType])
  async adminVipPaymentProofs(
    @Args('input', { type: () => AdminVipPaymentProofListInput, nullable: true }) input?: AdminVipPaymentProofListInput,
  ): Promise<VipPaymentProofType[]> {
    const rows = await this.listAdminUseCase.execute({
      status: input?.status,
      userId: input?.userId,
      currencyId: input?.currencyId,
      dateFrom: input?.dateFrom,
      dateTo: input?.dateTo,
      offset: input?.offset,
      limit: input?.limit,
    });

    return rows.map(VipPaymentProofMapper.toGraphQL);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Mutation(() => VipPaymentProofType)
  async adminConfirmVipPaymentProof(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<VipPaymentProofType> {
    const updated = await this.confirmUseCase.execute({
      id,
      reviewedById: user.id,
    });

    await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: getPrimaryRole(user.roles),
      action: UserActionLogAction.ADMIN_CONFIRM_VIP_PAYMENT_PROOF,
      resourceType: 'VIP_PAYMENT_PROOF',
      resourceId: updated.id,
      description: 'Admin confirmed VIP payment proof',
      metadata: { origin: 'ADMIN' },
      ...getRequestAuditContext(req),
    });

    return VipPaymentProofMapper.toGraphQL(updated);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Mutation(() => VipPaymentProofType)
  async adminCancelVipPaymentProof(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason', { type: () => String }) reason: string,
    @CurrentUser() user: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<VipPaymentProofType> {
    const updated = await this.cancelUseCase.execute({
      id,
      reason,
      reviewedById: user.id,
    });

    await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: getPrimaryRole(user.roles),
      action: UserActionLogAction.ADMIN_CANCEL_VIP_PAYMENT_PROOF,
      resourceType: 'VIP_PAYMENT_PROOF',
      resourceId: updated.id,
      description: 'Admin canceled VIP payment proof',
      metadata: {
        origin: 'ADMIN',
        hasReason: Boolean(reason?.trim()),
      },
      ...getRequestAuditContext(req),
    });

    return VipPaymentProofMapper.toGraphQL(updated);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => VipPaymentProofViewPayload)
  async vipPaymentProofViewUrl(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthContextUser,
  ): Promise<VipPaymentProofViewPayload> {
    return this.getViewUrlUseCase.execute({
      id,
      requesterUserId: user.id,
      requesterRoles: user.roles,
    });
  }
}