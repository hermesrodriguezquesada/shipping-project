import { Field, Int, ObjectType } from '@nestjs/graphql';
import { UserActionLogAction } from '@prisma/client';

@ObjectType('UserActionLogTopAction')
export class UserActionLogTopActionType {
  @Field(() => UserActionLogAction)
  action!: UserActionLogAction;

  @Field(() => Int)
  actionCount!: number;
}