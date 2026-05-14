import { Logger, UseGuards } from '@nestjs/common';
import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role, UserActionLogAction } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../../../../../core/auth/roles.decorator';
import { RolesGuard } from '../../../../../core/auth/roles.guard';
import { ActiveUserGuard } from '../../../../../core/auth/active-user.guard';
import { CurrentUser } from '../../../../auth/presentation/graphql/decorators/current-user.decorator';
import { GqlAuthGuard } from '../../../../auth/presentation/graphql/guards/gql-auth.guard';
import { AuthContextUser } from '../../../../auth/presentation/graphql/types/auth-context-user.type';
import { RecordUserActionLogUseCase } from '../../../../user-action-logs/application/use-cases/record-user-action-log.usecase';
import { recordUserActionLogSafe } from '../../../../user-action-logs/application/utils/record-user-action-log-safe';
import { getPrimaryRole, getRequestAuditContext } from '../../../../user-action-logs/application/utils/user-action-log-context';
import { AdminCancelPaymentRequestUseCase } from '../../../application/use-cases/admin-cancel-payment-request.usecase';
import { AdminAcceptPaymentRequestUseCase } from '../../../application/use-cases/admin-accept-payment-request.usecase';
import { AdminCompletePaymentRequestUseCase } from '../../../application/use-cases/admin-complete-payment-request.usecase';
import { AdminPaymentRequestsUseCase } from '../../../application/use-cases/admin-payment-requests.usecase';
import { AdminRenegotiatePaymentRequestUseCase } from '../../../application/use-cases/admin-renegotiate-payment-request.usecase';
import { ClientAcceptPaymentRequestUseCase } from '../../../application/use-cases/client-accept-payment-request.usecase';
import { ClientCancelPaymentRequestUseCase } from '../../../application/use-cases/client-cancel-payment-request.usecase';
import { CreatePaymentRequestUseCase } from '../../../application/use-cases/create-payment-request.usecase';
import { MyPaymentRequestsUseCase } from '../../../application/use-cases/my-payment-requests.usecase';
import { SystemCashPickupAddressUseCase } from '../../../application/use-cases/system-cash-pickup-address.usecase';
import { AdminCancelPaymentRequestInput } from '../inputs/admin-cancel-payment-request.input';
import { AdminPaymentRequestsInput } from '../inputs/admin-payment-requests.input';
import { AdminRenegotiatePaymentRequestInput } from '../inputs/admin-renegotiate-payment-request.input';
import { CreatePaymentRequestInput } from '../inputs/create-payment-request.input';
import { MyPaymentRequestsInput } from '../inputs/my-payment-requests.input';
import { PaymentRequestMapper } from '../mappers/payment-request.mapper';
import { PaymentRequestType } from '../types/payment-request.type';

@UseGuards(GqlAuthGuard)
@Resolver(() => PaymentRequestType)
export class PaymentRequestsResolver {
  private readonly logger = new Logger(PaymentRequestsResolver.name);

  constructor(
    private readonly createUseCase: CreatePaymentRequestUseCase,
    private readonly myPaymentRequestsUseCase: MyPaymentRequestsUseCase,
    private readonly clientAcceptUseCase: ClientAcceptPaymentRequestUseCase,
    private readonly clientCancelUseCase: ClientCancelPaymentRequestUseCase,
    private readonly systemCashPickupAddressUseCase: SystemCashPickupAddressUseCase,
    private readonly adminPaymentRequestsUseCase: AdminPaymentRequestsUseCase,
    private readonly adminRenegotiateUseCase: AdminRenegotiatePaymentRequestUseCase,
    private readonly adminAcceptUseCase: AdminAcceptPaymentRequestUseCase,
    private readonly adminCompleteUseCase: AdminCompletePaymentRequestUseCase,
    private readonly adminCancelUseCase: AdminCancelPaymentRequestUseCase,
    private readonly recordUserActionLogUseCase: RecordUserActionLogUseCase,
  ) {}

  // ─── Client queries ───────────────────────────────────────────────────────

  @UseGuards(ActiveUserGuard)
  @Query(() => [PaymentRequestType])
  async myPaymentRequests(
    @Args('input', { type: () => MyPaymentRequestsInput, nullable: true }) input: MyPaymentRequestsInput | null,
    @CurrentUser() user: AuthContextUser,
  ): Promise<PaymentRequestType[]> {
    const results = await this.myPaymentRequestsUseCase.execute({
      userId: user.id,
      status: input?.status,
      dateFrom: input?.dateFrom,
      dateTo: input?.dateTo,
      offset: input?.offset,
      limit: input?.limit,
    });
    return results.map(PaymentRequestMapper.toType);
  }

  @UseGuards(ActiveUserGuard)
  @Query(() => String)
  async systemCashPickupAddress(): Promise<string> {
    return this.systemCashPickupAddressUseCase.execute();
  }

  // ─── Client mutations ─────────────────────────────────────────────────────

  @UseGuards(ActiveUserGuard)
  @Mutation(() => PaymentRequestType)
  async createPaymentRequest(
    @Args('input') input: CreatePaymentRequestInput,
    @CurrentUser() user: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<PaymentRequestType> {
    const result = await this.createUseCase.execute({
      senderUserId: user.id,
      amount: input.amount,
      currencyId: input.currencyId,
      method: input.method,
      account: input.account,
      address: input.address,
      delivery: input.delivery,
    });

    const { ipAddress, userAgent } = getRequestAuditContext(req);
    await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: getPrimaryRole(user.roles),
      action: UserActionLogAction.CREATE_PAYMENT_REQUEST,
      resourceType: 'PaymentRequest',
      resourceId: result.id,
      description: `Cliente solicitó retiro de ${result.amount} (${result.method})`,
      ipAddress,
      userAgent,
    });

    return PaymentRequestMapper.toType(result);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => PaymentRequestType)
  async clientAcceptPaymentRequest(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<PaymentRequestType> {
    const { entity: clientAcceptEntity, transitioned: clientAcceptTransitioned } = await this.clientAcceptUseCase.execute({ userId: user.id, paymentRequestId: id });

    if (clientAcceptTransitioned) {
      const { ipAddress, userAgent } = getRequestAuditContext(req);
      await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: getPrimaryRole(user.roles),
        action: UserActionLogAction.CLIENT_ACCEPT_PAYMENT_REQUEST,
        resourceType: 'PaymentRequest',
        resourceId: id,
        description: 'Cliente aceptó renegociación de solicitud de pago',
        ipAddress,
        userAgent,
      });
    }

    return PaymentRequestMapper.toType(clientAcceptEntity);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => PaymentRequestType)
  async clientCancelPaymentRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason', { type: () => String, nullable: true }) reason: string | null,
    @CurrentUser() user: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<PaymentRequestType> {
    const { entity: clientCancelEntity, transitioned: clientCancelTransitioned } = await this.clientCancelUseCase.execute({
      userId: user.id,
      paymentRequestId: id,
      reason: reason ?? undefined,
    });

    if (clientCancelTransitioned) {
      const { ipAddress, userAgent } = getRequestAuditContext(req);
      await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: getPrimaryRole(user.roles),
        action: UserActionLogAction.CLIENT_CANCEL_PAYMENT_REQUEST,
        resourceType: 'PaymentRequest',
        resourceId: id,
        description: `Cliente canceló solicitud de pago. Razón: ${reason ?? 'no especificada'}`,
        ipAddress,
        userAgent,
      });
    }

    return PaymentRequestMapper.toType(clientCancelEntity);
  }

  // ─── Admin queries ────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [PaymentRequestType])
  async adminPaymentRequests(
    @Args('input') input: AdminPaymentRequestsInput,
  ): Promise<PaymentRequestType[]> {
    const results = await this.adminPaymentRequestsUseCase.execute(
      {
        ownerUserId: input.ownerUserId,
        status: input.status,
        method: input.method,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      },
      { offset: input.offset, limit: input.limit },
    );
    return results.map(PaymentRequestMapper.toType);
  }

  // ─── Admin mutations ──────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => PaymentRequestType)
  async adminRenegotiatePaymentRequest(
    @Args('input') input: AdminRenegotiatePaymentRequestInput,
    @CurrentUser() user: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<PaymentRequestType> {
    const { entity: renegotiateEntity, transitioned: renegotiateTransitioned } = await this.adminRenegotiateUseCase.execute({
      adminUserId: user.id,
      paymentRequestId: input.id,
      newAmount: input.newAmount,
      reason: input.reason,
    });

    if (renegotiateTransitioned) {
      const { ipAddress, userAgent } = getRequestAuditContext(req);
      await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: getPrimaryRole(user.roles),
        action: UserActionLogAction.ADMIN_RENEGOTIATE_PAYMENT_REQUEST,
        resourceType: 'PaymentRequest',
        resourceId: input.id,
        description: `Admin renegocio solicitud a ${input.newAmount}`,
        ipAddress,
        userAgent,
      });
    }

    return PaymentRequestMapper.toType(renegotiateEntity);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => PaymentRequestType)
  async adminAcceptPaymentRequest(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<PaymentRequestType> {
    const { entity: adminAcceptEntity, transitioned: adminAcceptTransitioned } = await this.adminAcceptUseCase.execute({ adminUserId: user.id, paymentRequestId: id });

    if (adminAcceptTransitioned) {
      const { ipAddress, userAgent } = getRequestAuditContext(req);
      await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: getPrimaryRole(user.roles),
        action: UserActionLogAction.ADMIN_ACCEPT_PAYMENT_REQUEST,
        resourceType: 'PaymentRequest',
        resourceId: id,
        description: 'Admin aceptó solicitud de pago',
        ipAddress,
        userAgent,
      });
    }

    return PaymentRequestMapper.toType(adminAcceptEntity);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => PaymentRequestType)
  async adminCompletePaymentRequest(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<PaymentRequestType> {
    const { entity: adminCompleteEntity, transitioned: adminCompleteTransitioned } = await this.adminCompleteUseCase.execute({ adminUserId: user.id, paymentRequestId: id });

    if (adminCompleteTransitioned) {
      const { ipAddress, userAgent } = getRequestAuditContext(req);
      await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: getPrimaryRole(user.roles),
        action: UserActionLogAction.ADMIN_COMPLETE_PAYMENT_REQUEST,
        resourceType: 'PaymentRequest',
        resourceId: id,
        description: 'Admin marcó solicitud de pago como completada (PAID)',
        ipAddress,
        userAgent,
      });
    }

    return PaymentRequestMapper.toType(adminCompleteEntity);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => PaymentRequestType)
  async adminCancelPaymentRequest(
    @Args('input') input: AdminCancelPaymentRequestInput,
    @CurrentUser() user: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<PaymentRequestType> {
    const { entity: adminCancelEntity, transitioned: adminCancelTransitioned } = await this.adminCancelUseCase.execute({
      adminUserId: user.id,
      paymentRequestId: input.id,
      reason: input.reason,
    });

    if (adminCancelTransitioned) {
      const { ipAddress, userAgent } = getRequestAuditContext(req);
      await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: getPrimaryRole(user.roles),
        action: UserActionLogAction.ADMIN_CANCEL_PAYMENT_REQUEST,
        resourceType: 'PaymentRequest',
        resourceId: input.id,
        description: `Admin canceló solicitud de pago. Razón: ${input.reason ?? 'no especificada'}`,
        ipAddress,
        userAgent,
      });
    }

    return PaymentRequestMapper.toType(adminCancelEntity);
  }
}
