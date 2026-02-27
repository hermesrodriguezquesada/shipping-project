import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ReceptionMethodType {
  @Field(() => ID)
  id!: string;

  @Field()
  code!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  enabled!: boolean;

  @Field(() => String, { nullable: true })
  imgUrl?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
