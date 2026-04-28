import { Field, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType('ElToqueRatesPayload')
export class ElToqueRatesPayloadType {
  @Field(() => GraphQLJSON)
  tasas!: Record<string, unknown>;

  @Field(() => String, { nullable: true })
  date?: string;

  @Field(() => Int, { nullable: true })
  hour?: number;

  @Field(() => Int, { nullable: true })
  minutes?: number;

  @Field(() => Int, { nullable: true })
  seconds?: number;
}