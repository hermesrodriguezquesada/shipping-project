import { Module } from '@nestjs/common';
import {
  INTERNAL_NOTIFICATION_COMMAND_PORT,
  INTERNAL_NOTIFICATION_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { ListMyNotificationsUseCase } from './application/use-cases/list-my-notifications.usecase';
import { MarkNotificationAsReadUseCase } from './application/use-cases/mark-notification-as-read.usecase';
import { PrismaInternalNotificationCommandAdapter } from './infrastructure/adapters/prisma-internal-notification-command.adapter';
import { PrismaInternalNotificationQueryAdapter } from './infrastructure/adapters/prisma-internal-notification-query.adapter';
import { InternalNotificationsResolver } from './presentation/graphql/resolvers/internal-notifications.resolver';

@Module({
  providers: [
    PrismaInternalNotificationCommandAdapter,
    PrismaInternalNotificationQueryAdapter,
    { provide: INTERNAL_NOTIFICATION_COMMAND_PORT, useExisting: PrismaInternalNotificationCommandAdapter },
    { provide: INTERNAL_NOTIFICATION_QUERY_PORT, useExisting: PrismaInternalNotificationQueryAdapter },
    ListMyNotificationsUseCase,
    MarkNotificationAsReadUseCase,
    InternalNotificationsResolver,
  ],
  exports: [INTERNAL_NOTIFICATION_COMMAND_PORT, INTERNAL_NOTIFICATION_QUERY_PORT],
})
export class InternalNotificationsModule {}
