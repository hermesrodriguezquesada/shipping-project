import { Module } from '@nestjs/common';
import { BENEFICIARY_COMMAND_PORT, BENEFICIARY_QUERY_PORT } from 'src/shared/constants/tokens';

import { PrismaBeneficiaryCommandAdapter } from './infrastructure/adapters/prisma-beneficiary-command.adapter';
import { PrismaBeneficiaryQueryAdapter } from './infrastructure/adapters/prisma-beneficiary-query.adapter';

import { CreateBeneficiaryUseCase } from './application/use-cases/create-beneficiary.usecase';
import { ListMyBeneficiariesUseCase } from './application/use-cases/list-my-beneficiaries.usecase';
import { GetBeneficiaryByIdUseCase } from './application/use-cases/get-beneficiary-by-id.usecase';
import { UpdateBeneficiaryUseCase } from './application/use-cases/update-beneficiary.usecase';
import { DeleteBeneficiaryUseCase } from './application/use-cases/delete-beneficiary.usecase';

import { BeneficiariesResolver } from './presentation/graphql/resolvers/beneficiaries.resolver';

@Module({
  providers: [
    PrismaBeneficiaryCommandAdapter,
    PrismaBeneficiaryQueryAdapter,
    { provide: BENEFICIARY_COMMAND_PORT, useExisting: PrismaBeneficiaryCommandAdapter },
    { provide: BENEFICIARY_QUERY_PORT, useExisting: PrismaBeneficiaryQueryAdapter },

    CreateBeneficiaryUseCase,
    ListMyBeneficiariesUseCase,
    GetBeneficiaryByIdUseCase,
    UpdateBeneficiaryUseCase,
    DeleteBeneficiaryUseCase,

    BeneficiariesResolver,
  ],
})
export class BeneficiariesModule {}
