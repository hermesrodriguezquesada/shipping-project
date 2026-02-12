import { Field, ObjectType } from '@nestjs/graphql';
import { UserType } from 'src/modules/users/presentation/graphql/types/user.type';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field()
  sessionId!: string;

  @Field(() => UserType)
  user!: UserType;
}
