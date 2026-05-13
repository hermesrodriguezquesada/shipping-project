import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext().req;
    const user = req?.user as { id?: string } | undefined;

    // No authenticated user — skip check (handled by GqlAuthGuard or OptionalGqlAuthGuard)
    if (!user?.id) return true;

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { isActive: true, isDeleted: true },
    });

    if (!dbUser || !dbUser.isActive || dbUser.isDeleted) {
      throw new ForbiddenException('Usuario bloqueado o inactivo');
    }

    return true;
  }
}
