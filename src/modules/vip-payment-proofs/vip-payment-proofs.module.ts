import { Module } from '@nestjs/common';
import { RolesGuard } from '../../core/auth/roles.guard';
import { AppConfigModule } from '../../core/config/config.module';
import { VIP_PAYMENT_PROOF_COMMAND_PORT, VIP_PAYMENT_PROOF_QUERY_PORT, VIP_PAYMENT_PROOF_STORAGE_PORT } from '../../shared/constants/tokens';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { UsersModule } from '../users/users.module';
import { AdminCancelVipPaymentProofUseCase } from './application/use-cases/admin-cancel-vip-payment-proof.usecase';
import { AdminConfirmVipPaymentProofUseCase } from './application/use-cases/admin-confirm-vip-payment-proof.usecase';
import { AdminListVipPaymentProofsUseCase } from './application/use-cases/admin-list-vip-payment-proofs.usecase';
import { CreateVipPaymentProofUseCase } from './application/use-cases/create-vip-payment-proof.usecase';
import { GetVipPaymentProofViewUrlUseCase } from './application/use-cases/get-vip-payment-proof-view-url.usecase';
import { ListMyVipPaymentProofsUseCase } from './application/use-cases/list-my-vip-payment-proofs.usecase';
import { PrismaVipPaymentProofCommandAdapter } from './infrastructure/adapters/prisma-vip-payment-proof-command.adapter';
import { PrismaVipPaymentProofQueryAdapter } from './infrastructure/adapters/prisma-vip-payment-proof-query.adapter';
import { S3VipPaymentProofStorageAdapter } from './infrastructure/adapters/s3-vip-payment-proof-storage.adapter';
import { VipPaymentProofsResolver } from './presentation/graphql/resolvers/vip-payment-proofs.resolver';

@Module({
  imports: [AppConfigModule, UsersModule, CatalogsModule],
  providers: [
    RolesGuard,
    PrismaVipPaymentProofCommandAdapter,
    PrismaVipPaymentProofQueryAdapter,
    S3VipPaymentProofStorageAdapter,
    { provide: VIP_PAYMENT_PROOF_COMMAND_PORT, useExisting: PrismaVipPaymentProofCommandAdapter },
    { provide: VIP_PAYMENT_PROOF_QUERY_PORT, useExisting: PrismaVipPaymentProofQueryAdapter },
    { provide: VIP_PAYMENT_PROOF_STORAGE_PORT, useExisting: S3VipPaymentProofStorageAdapter },
    CreateVipPaymentProofUseCase,
    ListMyVipPaymentProofsUseCase,
    AdminListVipPaymentProofsUseCase,
    AdminConfirmVipPaymentProofUseCase,
    AdminCancelVipPaymentProofUseCase,
    GetVipPaymentProofViewUrlUseCase,
    VipPaymentProofsResolver,
  ],
  exports: [VIP_PAYMENT_PROOF_COMMAND_PORT, VIP_PAYMENT_PROOF_QUERY_PORT, VIP_PAYMENT_PROOF_STORAGE_PORT],
})
export class VipPaymentProofsModule {}