import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { ListMyNotificationsUseCase } from 'src/modules/internal-notifications/application/use-cases/list-my-notifications.usecase';
import { MarkNotificationAsReadUseCase } from 'src/modules/internal-notifications/application/use-cases/mark-notification-as-read.usecase';
import { InternalNotificationEntity } from 'src/modules/internal-notifications/domain/entities/internal-notification.entity';
import { MyNotificationsInput } from '../inputs/my-notifications.input';
import { InternalNotificationObjectType } from '../types/internal-notification.type';

@UseGuards(GqlAuthGuard)
@Resolver()
export class InternalNotificationsResolver {
  constructor(
    private readonly listMyNotificationsUseCase: ListMyNotificationsUseCase,
    private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
  ) {}

  @Query(() => [InternalNotificationObjectType])
  async myNotifications(
    @CurrentUser() user: AuthContextUser,
    @Args('input', { type: () => MyNotificationsInput, nullable: true }) input?: MyNotificationsInput,
  ): Promise<InternalNotificationObjectType[]> {
    const rows = await this.listMyNotificationsUseCase.execute({
      userId: user.id,
      offset: input?.offset,
      limit: input?.limit,
      isRead: input?.isRead,
    });

    return rows.map(this.toGraphQL);
  }

  @Mutation(() => Boolean)
  async markNotificationAsRead(
    @CurrentUser() user: AuthContextUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.markNotificationAsReadUseCase.execute({ id, userId: user.id });
  }

  private toGraphQL(notification: InternalNotificationEntity): InternalNotificationObjectType {
    return {
      id: notification.id,
      type: notification.type,
      referenceId: notification.referenceId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
