import { Injectable } from "@nestjs/common";
import { UserAuthPort, UserAuthView } from "../../domain/ports/user-auth.port";
import { PrismaService } from "src/core/database/prisma.service";

@Injectable()
export class PrismaUserAuthAdapter implements UserAuthPort {
  constructor(private readonly prisma: PrismaService) {}

    async findAuthByEmail(email: string): Promise<UserAuthView | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, roles: true, isActive: true, isDeleted: true },
    });
  }
}