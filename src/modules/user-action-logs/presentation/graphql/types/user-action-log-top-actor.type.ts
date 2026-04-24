import { Field, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('UserActionLogTopActor')
export class UserActionLogTopActorType {
  @Field(() => ID, { nullable: true })
  actorUserId!: string | null;

  @Field(() => String, { nullable: true })
  actorEmail!: string | null;

  @Field(() => String, { nullable: true })
  actorRole!: string | null;

  @Field(() => Int)
  actionCount!: number;

  @Field(() => GraphQLISODateTime)
  lastActionAt!: Date;
}