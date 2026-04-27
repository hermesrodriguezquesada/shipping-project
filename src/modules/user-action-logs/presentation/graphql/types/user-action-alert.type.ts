import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { UserActionAlertType as PrismaUserActionAlertType } from '@prisma/client';
import { UserType } from 'src/modules/users/presentation/graphql/types/user.type';

@ObjectType('UserActionAlert')
export class UserActionAlertType {
  @Field(() => ID)
  id!: string;

  @Field(() => PrismaUserActionAlertType)
  type!: PrismaUserActionAlertType;

  @Field(() => String, { nullable: true })
  actorUserId!: string | null;

  @Field(() => String, { nullable: true })
  actorEmail!: string | null;

  @Field(() => String, { nullable: true })
  actorRole!: string | null;

  @Field(() => String)
  description!: string;

  @Field(() => String, { nullable: true })
  metadataJson!: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => UserType, { nullable: true })
  actor!: UserType | null;
}