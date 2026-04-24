import { Logger, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Request } from 'express';
import { UserActionLogAction } from '@prisma/client';

import { LoginUseCase } from '../../../application/use-cases/login.usecase';
import { RegisterUseCase } from '../../../application/use-cases/register.usecase';
import { GetMeUseCase } from '../../../application/use-cases/get-me.usecase';

import { LoginInput } from '../inputs/login.input';
import { RegisterInput } from '../inputs/register.input';
import { AuthPayload } from '../types/auth-payload.type';

import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

import { UserType } from 'src/modules/users/presentation/graphql/types/user.type';
import { UserMapper } from 'src/modules/users/presentation/mappers/user.mapper';
import { AuthContextUser } from '../types/auth-context-user.type';
import { RegisterInputDto } from '../../../application/dto/register.input.dto';
import { RefreshInput } from '../inputs/refresh.input';
import { LogoutInput } from '../inputs/logout.input';
import { RefreshUseCase } from 'src/modules/auth/application/use-cases/refresh.usecase';
import { LogoutUseCase } from 'src/modules/auth/application/use-cases/logout.usecase';
import { RequestPasswordResetUseCase } from 'src/modules/auth/application/use-cases/request-password-reset.usecase';
import { ResetPasswordUseCase } from 'src/modules/auth/application/use-cases/reset-password.usecase';
import { RequestPasswordResetInput } from '../inputs/request-password-reset.input';
import { ResetPasswordInput } from '../inputs/reset-password.input';
import { ChangePasswordInput } from '../inputs/change-password.input';
import { ChangePasswordUseCase } from 'src/modules/auth/application/use-cases/change-password.usecase';
import { RecordUserActionLogUseCase } from 'src/modules/user-action-logs/application/use-cases/record-user-action-log.usecase';
import { recordUserActionLogSafe } from 'src/modules/user-action-logs/application/utils/record-user-action-log-safe';
import { getPrimaryRole, getRequestAuditContext } from 'src/modules/user-action-logs/application/utils/user-action-log-context';

@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);

  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly recordUserActionLogUseCase: RecordUserActionLogUseCase,
  ) {}

  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput, @Context('req') req: Request): Promise<AuthPayload> {
    const { accessToken, refreshToken, sessionId, user } = await this.registerUseCase.execute(
      new RegisterInputDto(input.email, input.password, input.clientType, input.companyName),
    );

    const fullUser = await this.getMeUseCase.execute(user.id);
    const requestContext = getRequestAuditContext(req);

    await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
      actorUserId: fullUser.id,
      actorEmail: fullUser.email,
      actorRole: getPrimaryRole(fullUser.roles),
      action: UserActionLogAction.REGISTER,
      resourceType: 'USER',
      resourceId: fullUser.id,
      description: 'User registered',
      metadata: {
        clientType: input.clientType,
        sessionId,
      },
      ...requestContext,
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: UserMapper.toGraphQL(fullUser),
    };
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput, @Context('req') req: Request): Promise<AuthPayload> {
    const { accessToken, refreshToken, sessionId, user } = await this.loginUseCase.execute({
      email: input.email,
      password: input.password,
    });

    const fullUser = await this.getMeUseCase.execute(user.id);
    const requestContext = getRequestAuditContext(req);

    await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
      actorUserId: fullUser.id,
      actorEmail: fullUser.email,
      actorRole: getPrimaryRole(fullUser.roles),
      action: UserActionLogAction.LOGIN,
      resourceType: 'USER_SESSION',
      resourceId: sessionId,
      description: 'User logged in',
      metadata: { sessionId },
      ...requestContext,
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: UserMapper.toGraphQL(fullUser),
    };
  }

  @Mutation(() => AuthPayload)
  async refresh(@Args('input') input: RefreshInput): Promise<AuthPayload> {
    const { accessToken, refreshToken, sessionId, userId } = await this.refreshUseCase.execute(input.refreshToken);
    const fullUser = await this.getMeUseCase.execute(userId);

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: UserMapper.toGraphQL(fullUser),
    };
  }

  @Mutation(() => Boolean)
  async logout(@Args('input') input: LogoutInput, @Context('req') req: Request): Promise<boolean> {
    const result = await this.logoutUseCase.execute(input.refreshToken);

    await recordUserActionLogSafe(this.logger, this.recordUserActionLogUseCase, {
      actorUserId: result.userId,
      action: UserActionLogAction.LOGOUT,
      resourceType: 'USER_SESSION',
      resourceId: result.sessionId,
      description: 'User logged out',
      metadata: { sessionId: result.sessionId },
      ...getRequestAuditContext(req),
    });

    return result.success;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserType)
  async me(@CurrentUser() authUser: AuthContextUser): Promise<UserType> {
    const fullUser = await this.getMeUseCase.execute(authUser.id);
    return UserMapper.toGraphQL(fullUser);
  }

  @Mutation(() => Boolean)
  async requestPasswordReset( @Args('input') input: RequestPasswordResetInput): Promise<boolean> {
    return this.requestPasswordResetUseCase.execute(input.email);
  }

  @Mutation(() => Boolean)
  async resetPassword( @Args('input') input: ResetPasswordInput ): Promise<boolean> {
    return this.resetPasswordUseCase.execute({ token: input.token, newPassword: input.newPassword });
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async changePassword(
    @CurrentUser() authUser: AuthContextUser,
    @Args('input') input: ChangePasswordInput,
  ): Promise<boolean> {
    return this.changePasswordUseCase.execute({
      userId: authUser.id,
      oldPassword: input.oldPassword,
      newPassword: input.newPassword,
    });
  }

}
