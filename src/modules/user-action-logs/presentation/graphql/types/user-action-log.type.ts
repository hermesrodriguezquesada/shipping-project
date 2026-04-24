import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { UserActionLogAction } from '@prisma/client';
import { UserType } from 'src/modules/users/presentation/graphql/types/user.type';

@ObjectType('UserActionLog')
export class UserActionLogType {
  @Field(() => ID)
  id!: string;

  @Field(() => String, { nullable: true })
  actorUserId!: string | null;

  @Field(() => String, { nullable: true })
  actorEmail!: string | null;

  @Field(() => String, { nullable: true })
  actorRole!: string | null;

  @Field(() => UserActionLogAction)
  action!: UserActionLogAction;

  @Field(() => String, { nullable: true })
  resourceType!: string | null;

  @Field(() => String, { nullable: true })
  resourceId!: string | null;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => String, { nullable: true })
  metadataJson!: string | null;

  @Field(() => String, { nullable: true })
  ipAddress!: string | null;

  @Field(() => String, { nullable: true })
  userAgent!: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => UserType, { nullable: true })
  actor!: UserType | null;
}