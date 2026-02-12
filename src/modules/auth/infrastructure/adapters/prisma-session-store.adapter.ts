import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { SessionStorePort, Session } from '../../domain/ports/session-store.port';

@Injectable()
export class PrismaSessionStoreAdapter implements SessionStorePort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { userId: string; refreshTokenHash: string; expiresAt: Date }): Promise<Session> {
    return this.prisma.userSession.create({ data: input });
  }

  async findById(id: string): Promise<Session | null> {
    return this.prisma.userSession.findUnique({ where: { id } });
  }

  async setRefreshHash(sessionId: string, refreshTokenHash: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { refreshTokenHash },
    });
  }

  async revoke(sessionId: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async listForUser(userId: string, pagination?: { offset?: number; limit?: number }): Promise<Session[]> {
    const { offset = 0, limit = 50 } = pagination ?? {};
    return this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
  }

  async revokeAllForUserExcept(userId: string, keepSessionId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null, id: { not: keepSessionId } },
      data: { revokedAt: new Date() },
    });
  }
}

