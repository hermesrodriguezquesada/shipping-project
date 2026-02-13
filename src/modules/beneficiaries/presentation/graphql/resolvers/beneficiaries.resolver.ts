import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';

import { BeneficiaryType } from '../types/beneficiary.type';
import { CreateBeneficiaryInput } from '../inputs/create-beneficiary.input';
import { UpdateBeneficiaryInput } from '../inputs/update-beneficiary.input';
import { ListBeneficiariesInput } from '../inputs/list-beneficiaries.input';
import { BeneficiaryMapper } from '../../mappers/beneficiary.mapper';

import { CreateBeneficiaryUseCase } from '../../../application/use-cases/create-beneficiary.usecase';
import { ListMyBeneficiariesUseCase } from '../../../application/use-cases/list-my-beneficiaries.usecase';
import { GetBeneficiaryByIdUseCase } from '../../../application/use-cases/get-beneficiary-by-id.usecase';
import { UpdateBeneficiaryUseCase } from '../../../application/use-cases/update-beneficiary.usecase';
import { DeleteBeneficiaryUseCase } from '../../../application/use-cases/delete-beneficiary.usecase';

@UseGuards(GqlAuthGuard)
@Resolver(() => BeneficiaryType)
export class BeneficiariesResolver {
  constructor(
    private readonly createUC: CreateBeneficiaryUseCase,
    private readonly listUC: ListMyBeneficiariesUseCase,
    private readonly getUC: GetBeneficiaryByIdUseCase,
    private readonly updateUC: UpdateBeneficiaryUseCase,
    private readonly deleteUC: DeleteBeneficiaryUseCase,
  ) {}

  @Mutation(() => BeneficiaryType)
  async createBeneficiary(
    @Args('input', { type: () => CreateBeneficiaryInput }) input: CreateBeneficiaryInput,
    @CurrentUser() user: AuthContextUser,
  ) {
    const created = await this.createUC.execute({ ownerUserId: user.id, ...input });
    return BeneficiaryMapper.toGraphQL(created);
  }

  @Query(() => [BeneficiaryType])
  async myBeneficiaries(
    @Args('input', { type: () => ListBeneficiariesInput, nullable: true })
    input: ListBeneficiariesInput | undefined,
    @CurrentUser() user: AuthContextUser,
  ) {
    const items = await this.listUC.execute(user.id, {
      offset: input?.offset,
      limit: input?.limit,
    });
    return items.map(BeneficiaryMapper.toGraphQL);
  }

  @Query(() => BeneficiaryType)
  async beneficiary(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthContextUser,
  ) {
    const item = await this.getUC.execute({ id, ownerUserId: user.id });
    return BeneficiaryMapper.toGraphQL(item);
  }

  @Mutation(() => BeneficiaryType)
  async updateBeneficiary(
    @Args('input') input: UpdateBeneficiaryInput,
    @CurrentUser() user: AuthContextUser,
  ) {
    const updated = await this.updateUC.execute({ ownerUserId: user.id, ...input });
    return BeneficiaryMapper.toGraphQL(updated);
  }

  @Mutation(() => Boolean)
  async deleteBeneficiary(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthContextUser,
  ) {
    return this.deleteUC.execute({ id, ownerUserId: user.id });
  }
}
