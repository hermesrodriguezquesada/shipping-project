import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthContextUser } from '../types/auth-context-user.type';

import { SessionType } from '../types/session.type';
import { SessionGraphqlMapper } from '../../mappers/session.mapper';
import { ListMySessionsUseCase } from 'src/modules/auth/application/use-cases/list-my-sessions.usecase';
import { RevokeMySessionUseCase } from 'src/modules/auth/application/use-cases/revoke-my-session.usecase';
import { RevokeOtherMySessionsUseCase } from 'src/modules/auth/application/use-cases/revoke-other-my-sessions.usecase';


@Resolver(() => SessionType)
export class SessionResolver {
  constructor(
    private readonly listMySessions: ListMySessionsUseCase,
    private readonly revokeMySession: RevokeMySessionUseCase,
    private readonly revokeOtherMySessions: RevokeOtherMySessionsUseCase,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => [SessionType], { name: 'mySessions' })
  async mySessions(
    @CurrentUser() user: AuthContextUser,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<SessionType[]> {
    const sessions = await this.listMySessions.execute(user.id, {
      offset: offset ?? 0,
      limit: limit ?? 50,
    });
    return SessionGraphqlMapper.toGraphQLList(sessions);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean, { name: 'revokeMySession' })
  revokeMySessionMutation(
    @CurrentUser() user: AuthContextUser,
    @Args('sessionId') sessionId: string,
  ) {
    return this.revokeMySession.execute({ userId: user.id, sessionId });
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean, { name: 'revokeOtherMySessions' })
  revokeOtherMySessionsMutation(
    @CurrentUser() user: AuthContextUser,
    @Args('currentSessionId') currentSessionId: string,
  ) {
    return this.revokeOtherMySessions.execute({ userId: user.id, currentSessionId });
  }
}
