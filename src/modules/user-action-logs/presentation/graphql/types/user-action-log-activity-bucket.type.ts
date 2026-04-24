import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('UserActionLogActivityBucket')
export class UserActionLogActivityBucketType {
  @Field(() => String)
  date!: string;

  @Field(() => Int)
  actionCount!: number;

  @Field(() => Int)
  uniqueActors!: number;
}