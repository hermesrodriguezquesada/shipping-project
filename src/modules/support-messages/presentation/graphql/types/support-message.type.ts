import { Field, ID, ObjectType } from '@nestjs/graphql';
import { SupportMessageStatus } from '@prisma/client';
import { UserType } from 'src/modules/users/presentation/graphql/types/user.type';

@ObjectType()
export class SupportMessageType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID, { nullable: true })
  authorId!: string | null;

  @Field(() => String, { nullable: true })
  email!: string | null;

  @Field(() => String, { nullable: true })
  phone!: string | null;

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

  @Field(() => UserType, { nullable: true })
  author!: UserType | null;

  @Field(() => UserType, { nullable: true })
  answeredBy!: UserType | null;
}
