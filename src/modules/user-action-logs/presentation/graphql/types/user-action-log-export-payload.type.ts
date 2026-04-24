import { Field, GraphQLISODateTime, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('UserActionLogExportPayload')
export class UserActionLogExportPayloadType {
  @Field(() => String)
  contentBase64!: string;

  @Field(() => String)
  fileName!: string;

  @Field(() => String)
  mimeType!: string;

  @Field(() => Int)
  sizeBytes!: number;

  @Field(() => GraphQLISODateTime)
  generatedAt!: Date;
}