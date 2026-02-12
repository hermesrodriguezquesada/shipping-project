import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthContextUser } from '../types/auth-context-user.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContextUser => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user as AuthContextUser;
  },
);
