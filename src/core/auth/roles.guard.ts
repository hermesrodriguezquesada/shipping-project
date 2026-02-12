import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) return true;

    const gqlCtx = GqlExecutionContext.create(context);
    const { req } = gqlCtx.getContext();
    const user = req.user as { roles?: Role[] } | undefined;

    const roles = user?.roles ?? [];
    if (roles.length === 0) return false;

    return requiredRoles.some((r) => roles.includes(r));
  }
}
