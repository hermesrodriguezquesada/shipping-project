import { Module } from '@nestjs/common';
import { RolesGuard } from '../../core/auth/roles.guard';
import {
  PAYMENT_REQUEST_COMMAND_PORT,
  PAYMENT_REQUEST_QUERY_PORT,
} from '../../shared/constants/tokens';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { InternalNotificationsModule } from '../internal-notifications/internal-notifications.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { UserActionLogsModule } from '../user-action-logs/user-action-logs.module';
import { UsersModule } from '../users/users.module';
import { VipPricingModule } from '../vip-pricing/vip-pricing.module';
import { AdminAcceptPaymentRequestUseCase } from './application/use-cases/admin-accept-payment-request.usecase';
import { AdminCancelPaymentRequestUseCase } from './application/use-cases/admin-cancel-payment-request.usecase';
import { AdminCompletePaymentRequestUseCase } from './application/use-cases/admin-complete-payment-request.usecase';
import { AdminPaymentRequestsUseCase } from './application/use-cases/admin-payment-requests.usecase';
import { AdminRenegotiatePaymentRequestUseCase } from './application/use-cases/admin-renegotiate-payment-request.usecase';
import { ClientAcceptPaymentRequestUseCase } from './application/use-cases/client-accept-payment-request.usecase';
import { ClientCancelPaymentRequestUseCase } from './application/use-cases/client-cancel-payment-request.usecase';
import { CreatePaymentRequestUseCase } from './application/use-cases/create-payment-request.usecase';
import { MyPaymentRequestsUseCase } from './application/use-cases/my-payment-requests.usecase';
import { SystemCashPickupAddressUseCase } from './application/use-cases/system-cash-pickup-address.usecase';
import { PrismaPaymentRequestCommandAdapter } from './infrastructure/adapters/prisma-payment-request-command.adapter';
import { PrismaPaymentRequestQueryAdapter } from './infrastructure/adapters/prisma-payment-request-query.adapter';
import { PaymentRequestsResolver } from './presentation/graphql/resolvers/payment-requests.resolver';

@Module({
  imports: [
    UsersModule,
    InternalNotificationsModule,
    SystemSettingsModule,
    CatalogsModule,
    VipPricingModule,
    UserActionLogsModule,
  ],
  providers: [
    RolesGuard,
    PrismaPaymentRequestQueryAdapter,
    PrismaPaymentRequestCommandAdapter,
    { provide: PAYMENT_REQUEST_QUERY_PORT, useExisting: PrismaPaymentRequestQueryAdapter },
    { provide: PAYMENT_REQUEST_COMMAND_PORT, useExisting: PrismaPaymentRequestCommandAdapter },
    CreatePaymentRequestUseCase,
    MyPaymentRequestsUseCase,
    ClientAcceptPaymentRequestUseCase,
    ClientCancelPaymentRequestUseCase,
    SystemCashPickupAddressUseCase,
    AdminPaymentRequestsUseCase,
    AdminRenegotiatePaymentRequestUseCase,
    AdminAcceptPaymentRequestUseCase,
    AdminCompletePaymentRequestUseCase,
    AdminCancelPaymentRequestUseCase,
    PaymentRequestsResolver,
  ],
})
export class PaymentRequestsModule {}
