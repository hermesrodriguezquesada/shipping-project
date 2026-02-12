import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role, IdentityStatus } from '@prisma/client';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';

import { Inject } from '@nestjs/common';
import { IDENTITY_QUERY_PORT } from 'src/shared/constants/tokens';
import { IdentityQueryPort } from 'src/modules/identity/domain/ports/identity-query.port';

import { SubmitIdentityUseCase } from 'src/modules/identity/application/use-cases/submit-identity.usecase';
import { GetMyIdentityUseCase } from 'src/modules/identity/application/use-cases/get-my-identity.usecase';
import { AdminReviewIdentityUseCase } from 'src/modules/identity/application/use-cases/admin-review-identity.usecase';

import { SubmitIdentityInput } from '../inputs/submit-identity.input';
import { AdminReviewIdentityInput } from '../inputs/admin-review-identity.input';
import { IdentityVerificationType } from '../types/identity.type';
import { IdentityGraphqlMapper } from '../../mappers/identity.mapper';

@Resolver()
export class IdentityResolver {
  constructor(
    private readonly submit: SubmitIdentityUseCase,
    private readonly myIdentity: GetMyIdentityUseCase,
    private readonly adminReview: AdminReviewIdentityUseCase,
    @Inject(IDENTITY_QUERY_PORT) 
    private readonly identityQuery: IdentityQueryPort,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  submitIdentityVerification(
    @Args('input') input: SubmitIdentityInput,
    @CurrentUser() user: AuthContextUser,
  ) {
    return this.submit.execute({ ...input, userId: user.id });
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => IdentityVerificationType, { nullable: true })
  async myIdentityVerification(@CurrentUser() user: AuthContextUser) {
    const view = await this.myIdentity.execute(user.id);
    return view ? IdentityGraphqlMapper.toGraphQL(view) : null;
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [IdentityVerificationType])
  async adminPendingVerifications(
    @Args('offset', { nullable: true }) offset?: number,
    @Args('limit', { nullable: true }) limit?: number,
  ) {
    const views = await this.identityQuery.listByStatus(IdentityStatus.PENDING, {
      offset: offset ?? 0,
      limit: limit ?? 50,
    });
    return IdentityGraphqlMapper.toGraphQLList(views);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Boolean)
  adminReviewIdentityVerification(
    @Args('input') input: AdminReviewIdentityInput,
    @CurrentUser() admin: AuthContextUser,
  ) {
    return this.adminReview.execute({
      userId: input.userId,
      status: input.status,
      reviewedById: admin.id,
      rejectionReason: input.rejectionReason,
    });
  }
}
