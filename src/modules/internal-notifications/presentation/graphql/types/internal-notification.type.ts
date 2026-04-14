import { Field, ID, ObjectType } from '@nestjs/graphql';
import { InternalNotificationType as PrismaInternalNotificationType } from '@prisma/client';

@ObjectType()
export class InternalNotificationObjectType {
  @Field(() => ID)
  id!: string;

  @Field(() => PrismaInternalNotificationType)
  type!: PrismaInternalNotificationType;

  @Field(() => String, { nullable: true })
  referenceId!: string | null;

  @Field()
  isRead!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
