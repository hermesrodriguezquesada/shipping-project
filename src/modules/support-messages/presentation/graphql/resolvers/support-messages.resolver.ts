import { Logger, UseGuards } from '@nestjs/common';
import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role, UserActionLogAction } from '@prisma/client';
import { Request } from 'express';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { OptionalGqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/optional-gql-auth.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { AdminSupportMessagesByAuthorUseCase } from 'src/modules/support-messages/application/use-cases/admin-support-messages-by-author.usecase';
import { AdminSupportMessagesUseCase } from 'src/modules/support-messages/application/use-cases/admin-support-messages.usecase';
import { AnswerSupportMessageUseCase } from 'src/modules/support-messages/application/use-cases/answer-support-message.usecase';
import { CreateSupportMessageUseCase } from 'src/modules/support-messages/application/use-cases/create-support-message.usecase';
import { MySupportMessagesUseCase } from 'src/modules/support-messages/application/use-cases/my-support-messages.usecase';
import { SupportMessageMapper } from '../../mappers/support-message.mapper';
import { AnswerSupportMessageInput } from '../inputs/answer-support-message.input';
import { CreateSupportMessageInput } from '../inputs/create-support-message.input';
import { SupportMessagesPaginationInput } from '../inputs/support-messages-pagination.input';
import { SupportMessageType } from '../types/support-message.type';
import { RecordUserActionLogUseCase } from 'src/modules/user-action-logs/application/use-cases/record-user-action-log.usecase';
import { recordUserActionLogSafe } from 'src/modules/user-action-logs/application/utils/record-user-action-log-safe';
import { getPrimaryRole, getRequestAuditContext } from 'src/modules/user-action-logs/application/utils/user-action-log-context';

@Resolver(() => SupportMessageType)
export class SupportMessagesResolver {
  private readonly logger = new Logger(SupportMessagesResolver.name);

  constructor(
    private readonly createSupportMessageUseCase: CreateSupportMessageUseCase,
    private readonly answerSupportMessageUseCase: AnswerSupportMessageUseCase,
    private readonly mySupportMessagesUseCase: MySupportMessagesUseCase,
    private readonly adminSupportMessagesUseCase: AdminSupportMessagesUseCase,
    private readonly adminSupportMessagesByAuthorUseCase: AdminSupportMessagesByAuthorUseCase,
    private readonly recordUserActionLogUseCase: RecordUserActionLogUseCase,
  ) {}

  @UseGuards(OptionalGqlAuthGuard)
  @Mutation(() => SupportMessageType)
  async createSupportMessage(
    @CurrentUser() authUser: AuthContextUser | undefined,
    @Args('input') input: CreateSupportMessageInput,
    @Context('req') req: Request,
  ): Promise<SupportMessageType> {
    const created = await this.createSupportMessageUseCase.execute({
      authorId: authUser?.id ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      title: input.title,
      content: input.content,
    });

    await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
      actorUserId: authUser?.id ?? null,
      actorEmail: authUser?.email ?? input.email ?? null,
      actorRole: getPrimaryRole(authUser?.roles),
      action: UserActionLogAction.CREATE_SUPPORT_MESSAGE,
      resourceType: 'SUPPORT_MESSAGE',
      resourceId: created.id,
      description: 'Support message created',
      metadata: {
        hasAuthenticatedActor: Boolean(authUser?.id),
        hasEmail: Boolean(input.email),
        hasPhone: Boolean(input.phone),
      },
      ...getRequestAuditContext(req),
    });

    return SupportMessageMapper.toGraphQL(created);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Mutation(() => SupportMessageType)
  async answerSupportMessage(
    @CurrentUser() authUser: AuthContextUser,
    @Args('input') input: AnswerSupportMessageInput,
    @Context('req') req: Request,
  ): Promise<SupportMessageType> {
    const answered = await this.answerSupportMessageUseCase.execute({
      id: input.id,
      answer: input.answer,
      answeredById: authUser.id,
    });

    await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
      actorUserId: authUser.id,
      actorEmail: authUser.email,
      actorRole: getPrimaryRole(authUser.roles),
      action: UserActionLogAction.ANSWER_SUPPORT_MESSAGE,
      resourceType: 'SUPPORT_MESSAGE',
      resourceId: answered.id,
      description: 'Support message answered',
      metadata: { hasAnswer: Boolean(input.answer?.trim()) },
      ...getRequestAuditContext(req),
    });

    return SupportMessageMapper.toGraphQL(answered);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [SupportMessageType])
  async mySupportMessages(
    @CurrentUser() authUser: AuthContextUser,
    @Args('input', { type: () => SupportMessagesPaginationInput, nullable: true })
    input?: SupportMessagesPaginationInput,
  ): Promise<SupportMessageType[]> {
    const rows = await this.mySupportMessagesUseCase.execute({
      authorId: authUser.id,
      offset: input?.offset,
      limit: input?.limit,
    });

    return rows.map(SupportMessageMapper.toGraphQL);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => [SupportMessageType])
  async adminSupportMessages(
    @Args('input', { type: () => SupportMessagesPaginationInput, nullable: true })
    input?: SupportMessagesPaginationInput,
  ): Promise<SupportMessageType[]> {
    const rows = await this.adminSupportMessagesUseCase.execute({
      offset: input?.offset,
      limit: input?.limit,
    });

    return rows.map(SupportMessageMapper.toGraphQL);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Query(() => [SupportMessageType])
  async adminSupportMessagesByAuthor(
    @Args('authorId', { type: () => ID }) authorId: string,
    @Args('input', { type: () => SupportMessagesPaginationInput, nullable: true })
    input?: SupportMessagesPaginationInput,
  ): Promise<SupportMessageType[]> {
    const rows = await this.adminSupportMessagesByAuthorUseCase.execute({
      authorId,
      offset: input?.offset,
      limit: input?.limit,
    });

    return rows.map(SupportMessageMapper.toGraphQL);
  }
}
