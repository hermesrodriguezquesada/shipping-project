import { Field, ObjectType } from '@nestjs/graphql';
import { UserActionLogActivityBucketType } from './user-action-log-activity-bucket.type';
import { UserActionLogSummaryType } from './user-action-log-summary.type';
import { UserActionLogTopActionType } from './user-action-log-top-action.type';
import { UserActionLogTopActorType } from './user-action-log-top-actor.type';
import { UserActionLogType } from './user-action-log.type';

@ObjectType('UserActionLogDashboard')
export class UserActionLogDashboardType {
  @Field(() => UserActionLogSummaryType)
  summary!: UserActionLogSummaryType;

  @Field(() => [UserActionLogActivityBucketType])
  activityByDay!: UserActionLogActivityBucketType[];

  @Field(() => [UserActionLogTopActorType])
  topActors!: UserActionLogTopActorType[];

  @Field(() => [UserActionLogTopActionType])
  topActions!: UserActionLogTopActionType[];

  @Field(() => [UserActionLogType])
  recentCriticalActions!: UserActionLogType[];
}