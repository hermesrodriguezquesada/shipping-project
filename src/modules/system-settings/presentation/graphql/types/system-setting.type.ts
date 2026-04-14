import { Field, ID, ObjectType } from '@nestjs/graphql';
import { SystemSettingType as PrismaSystemSettingType } from '@prisma/client';

@ObjectType('SystemSetting')
export class SystemSettingObjectType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => PrismaSystemSettingType)
  type!: PrismaSystemSettingType;

  @Field(() => String, { nullable: true })
  value!: string | null;

  @Field(() => Boolean)
  isMasked!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
