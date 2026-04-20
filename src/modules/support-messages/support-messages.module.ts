import { Module } from '@nestjs/common';
import { RolesGuard } from 'src/core/auth/roles.guard';
import {
  SUPPORT_MESSAGE_COMMAND_PORT,
  SUPPORT_MESSAGE_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { InternalNotificationsModule } from '../internal-notifications/internal-notifications.module';
import { UsersModule } from '../users/users.module';
import { AdminSupportMessagesByAuthorUseCase } from './application/use-cases/admin-support-messages-by-author.usecase';
import { AdminSupportMessagesUseCase } from './application/use-cases/admin-support-messages.usecase';
import { AnswerSupportMessageUseCase } from './application/use-cases/answer-support-message.usecase';
import { CreateSupportMessageUseCase } from './application/use-cases/create-support-message.usecase';
import { MySupportMessagesUseCase } from './application/use-cases/my-support-messages.usecase';
import { PrismaSupportMessageCommandAdapter } from './infrastructure/adapters/prisma-support-message-command.adapter';
import { PrismaSupportMessageQueryAdapter } from './infrastructure/adapters/prisma-support-message-query.adapter';
import { SupportMessagesResolver } from './presentation/graphql/resolvers/support-messages.resolver';

@Module({
  imports: [InternalNotificationsModule, UsersModule],
  providers: [
    RolesGuard,
    PrismaSupportMessageCommandAdapter,
    PrismaSupportMessageQueryAdapter,
    {
      provide: SUPPORT_MESSAGE_COMMAND_PORT,
      useExisting: PrismaSupportMessageCommandAdapter,
    },
    {
      provide: SUPPORT_MESSAGE_QUERY_PORT,
      useExisting: PrismaSupportMessageQueryAdapter,
    },
    CreateSupportMessageUseCase,
    AnswerSupportMessageUseCase,
    MySupportMessagesUseCase,
    AdminSupportMessagesUseCase,
    AdminSupportMessagesByAuthorUseCase,
    SupportMessagesResolver,
  ],
  exports: [SUPPORT_MESSAGE_COMMAND_PORT, SUPPORT_MESSAGE_QUERY_PORT],
})
export class SupportMessagesModule {}
