import { Module } from '@nestjs/common';
import { PrismaIdentityAdapter } from './infrastructure/adapters/prisma-identity.adapter';
import { IDENTITY_COMMAND_PORT, IDENTITY_QUERY_PORT } from 'src/shared/constants/tokens';
import { SubmitIdentityUseCase } from './application/use-cases/submit-identity.usecase';
import { GetMyIdentityUseCase } from './application/use-cases/get-my-identity.usecase';
import { AdminReviewIdentityUseCase } from './application/use-cases/admin-review-identity.usecase';
import { IdentityResolver } from './presentation/graphql/resolvers/identity.resolver';


@Module({
  providers: [
    PrismaIdentityAdapter,
    { provide: IDENTITY_COMMAND_PORT, useExisting: PrismaIdentityAdapter },
    { provide: IDENTITY_QUERY_PORT, useExisting: PrismaIdentityAdapter },

    SubmitIdentityUseCase,
    GetMyIdentityUseCase,
    AdminReviewIdentityUseCase,

    IdentityResolver,
  ],
})
export class IdentityModule {}
