import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

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

@Resolver()
export class AuthResolver {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,

  ) {}

  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    const { accessToken, refreshToken, sessionId, user } = await this.registerUseCase.execute(new RegisterInputDto(input.email, input.password));

    const fullUser = await this.getMeUseCase.execute(user.id);

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: UserMapper.toGraphQL(fullUser),
    };
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    const { accessToken, refreshToken, sessionId, user } = await this.loginUseCase.execute({
      email: input.email,
      password: input.password,
    });

    const fullUser = await this.getMeUseCase.execute(user.id);

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
  async logout(@Args('input') input: LogoutInput): Promise<boolean> {
    return this.logoutUseCase.execute(input.refreshToken);
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

}
