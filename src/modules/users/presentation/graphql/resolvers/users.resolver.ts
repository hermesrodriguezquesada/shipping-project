import { Resolver, Query, Args, ID, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { UserType } from '../types/user.type';
import { GetUserByIdUseCase } from '../../../application/use-cases/get-user-by-id.usecase';
import { UserMapper } from 'src/modules/users/presentation/mappers/user.mapper';
import { UserEntity } from '../../../domain/entities/user.entity';
import { UpdateMyProfileUseCase } from 'src/modules/users/application/use-cases/update-my-profile.usecase';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { UpdateMyProfileInput } from '../inputs/update-my-profile.input';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
  ) {}

  @Query(() => UserType, { nullable: true })
  async user(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<UserType | null> {
    const user: UserEntity = await this.getUserByIdUseCase.execute(id);
    return UserMapper.toGraphQL(user);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserType)
  async myProfile(@CurrentUser() authUser: AuthContextUser): Promise<UserType> {
    const user = await this.getUserByIdUseCase.execute(authUser.id);
    return UserMapper.toGraphQL(user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserType)
  async updateMyProfile(
    @CurrentUser() authUser: AuthContextUser,
    @Args('input') input: UpdateMyProfileInput,
  ): Promise<UserType> {
    const updated = await this.updateMyProfileUseCase.execute(authUser.id, input);
    return UserMapper.toGraphQL(updated);
  }
}
