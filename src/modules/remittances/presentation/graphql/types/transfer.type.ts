import { Field, ObjectType } from '@nestjs/graphql';
import { TransferStatus } from '@prisma/client';

@ObjectType()
export class TransferType {
  @Field(() => TransferStatus)
  status!: TransferStatus;

  @Field(() => String, { nullable: true })
  providerRef?: string | null;

  @Field(() => String, { nullable: true })
  failureReason?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
