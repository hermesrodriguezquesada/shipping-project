import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { PasswordResetStorePort, PasswordResetRecord } from '../../domain/ports/password-reset-store.port';

@Injectable()
export class PrismaPasswordResetStoreAdapter implements PasswordResetStorePort {
  constructor(private readonly prisma: PrismaService) {}

  create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<PasswordResetRecord> {
    return this.prisma.passwordResetToken.create({ data: input });
  }

  findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null> {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({ where: { userId } });
  }
}
