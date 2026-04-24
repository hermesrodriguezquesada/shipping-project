import { Field, GraphQLISODateTime, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('UserActionLogSummary')
export class UserActionLogSummaryType {
  @Field(() => Int)
  totalActions!: number;

  @Field(() => Int)
  uniqueActors!: number;

  @Field(() => GraphQLISODateTime)
  dateFrom!: Date;

  @Field(() => GraphQLISODateTime)
  dateTo!: Date;
}