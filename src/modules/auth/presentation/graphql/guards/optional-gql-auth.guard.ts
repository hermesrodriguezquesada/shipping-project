import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalGqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser, info?: { message?: string }): TUser | null {
    if (err) {
      throw err;
    }

    const message = info?.message?.toLowerCase();
    const missingToken = message?.includes('no auth token') || message?.includes('no authorization token');

    if (!user && !missingToken) {
      throw new UnauthorizedException();
    }

    return user ?? null;
  }
}
