import { Field, ID, ObjectType } from '@nestjs/graphql';
import { SupportMessageStatus } from '@prisma/client';

@ObjectType()
export class SupportMessageType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  authorId!: string;

  @Field()
  title!: string;

  @Field()
  content!: string;

  @Field(() => String, { nullable: true })
  answer!: string | null;

  @Field(() => String, { nullable: true })
  answeredById!: string | null;

  @Field(() => Date, { nullable: true })
  answeredAt!: Date | null;

  @Field(() => SupportMessageStatus)
  status!: SupportMessageStatus;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
