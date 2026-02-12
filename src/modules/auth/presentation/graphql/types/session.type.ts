import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SessionType {
  @Field()
  id!: string;

  @Field()
  userId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  expiresAt!: Date;

  @Field({ nullable: true })
  revokedAt?: Date;

  @Field()
  isActive!: boolean;
}
