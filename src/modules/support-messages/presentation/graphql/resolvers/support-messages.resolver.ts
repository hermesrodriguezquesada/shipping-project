import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
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

@UseGuards(GqlAuthGuard)
@Resolver(() => SupportMessageType)
export class SupportMessagesResolver {
  constructor(
    private readonly createSupportMessageUseCase: CreateSupportMessageUseCase,
    private readonly answerSupportMessageUseCase: AnswerSupportMessageUseCase,
    private readonly mySupportMessagesUseCase: MySupportMessagesUseCase,
    private readonly adminSupportMessagesUseCase: AdminSupportMessagesUseCase,
    private readonly adminSupportMessagesByAuthorUseCase: AdminSupportMessagesByAuthorUseCase,
  ) {}

  @Mutation(() => SupportMessageType)
  async createSupportMessage(
    @CurrentUser() authUser: AuthContextUser,
    @Args('input') input: CreateSupportMessageInput,
  ): Promise<SupportMessageType> {
    const created = await this.createSupportMessageUseCase.execute({
      authorId: authUser.id,
      title: input.title,
      content: input.content,
    });

    return SupportMessageMapper.toGraphQL(created);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Mutation(() => SupportMessageType)
  async answerSupportMessage(
    @CurrentUser() authUser: AuthContextUser,
    @Args('input') input: AnswerSupportMessageInput,
  ): Promise<SupportMessageType> {
    const answered = await this.answerSupportMessageUseCase.execute({
      id: input.id,
      answer: input.answer,
      answeredById: authUser.id,
    });

    return SupportMessageMapper.toGraphQL(answered);
  }

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

  @UseGuards(RolesGuard)
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

  @UseGuards(RolesGuard)
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
