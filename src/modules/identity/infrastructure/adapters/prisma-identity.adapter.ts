import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  IdentityCommandPort,
  IdentitySubmission,
} from '../../domain/ports/identity-command.port';
import {
  IdentityQueryPort,
  IdentityVerificationView,
} from '../../domain/ports/identity-query.port';
import { IdentityStatus } from '@prisma/client';
import { IdentityPersistenceMapper } from '../mappers/identity.mapper';

@Injectable()
export class PrismaIdentityAdapter implements IdentityCommandPort, IdentityQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async upsertSubmission(input: IdentitySubmission): Promise<void> {
    const { userId, ...data } = input;

    await this.prisma.userIdentityVerification.upsert({
      where: { userId },
      create: {
        userId,
        status: IdentityStatus.PENDING,
        ...data,
      },
      update: {
        status: IdentityStatus.PENDING,
        ...data,
        rejectionReason: null,
        reviewedAt: null,
        reviewedById: null,
      },
    });
  }

  async review(input: {
    userId: string;
    status: IdentityStatus;
    reviewedById: string;
    rejectionReason?: string;
  }): Promise<void> {
    await this.prisma.userIdentityVerification.update({
      where: { userId: input.userId },
      data: {
        status: input.status,
        reviewedAt: new Date(),
        reviewedById: input.reviewedById,
        rejectionReason:
          input.status === IdentityStatus.REJECTED
            ? input.rejectionReason ?? 'Rejected'
            : null,
      },
    });
  }

  async getByUserId(userId: string): Promise<IdentityVerificationView | null> {
    const row = await this.prisma.userIdentityVerification.findUnique({
      where: { userId },
    });
    return row ? IdentityPersistenceMapper.toView(row) : null;
  }

  async listByStatus( status: IdentityStatus, pagination?: { offset?: number; limit?: number }): Promise<IdentityVerificationView[]> {
    const rows = await this.prisma.userIdentityVerification.findMany({
      where: { status },
      skip: pagination?.offset ?? 0,
      take: pagination?.limit ?? 50,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(IdentityPersistenceMapper.toView);
  }
}
