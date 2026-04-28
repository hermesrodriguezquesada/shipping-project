import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('ElToqueRate')
export class ElToqueRateType {
  @Field()
  code!: string;

  @Field()
  sourceCode!: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field()
  rate!: string;

  @Field()
  source!: string;

  @Field(() => String, { nullable: true })
  updatedAt?: string;
}