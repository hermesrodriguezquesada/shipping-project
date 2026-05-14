import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { VipPaymentProofStatus } from '@prisma/client';
import { VipPaymentProofCommandPort } from '../../domain/ports/vip-payment-proof-command.port';

@Injectable()
export class PrismaVipPaymentProofCommandAdapter implements VipPaymentProofCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    userId: string;
    accountHolderName: string;
    amount: import('@prisma/client').Prisma.Decimal;
    currencyId: string;
    paymentProofKey: string;
  }): Promise<string> {
    const created = await this.prisma.vipPaymentProof.create({
      data: {
        userId: input.userId,
        accountHolderName: input.accountHolderName,
        amount: input.amount,
        currencyId: input.currencyId,
        paymentProofKey: input.paymentProofKey,
      },
      select: { id: true },
    });

    return created.id;
  }

  async confirmPending(input: { id: string; reviewedById: string; reviewedAt: Date; amountUsd: import('@prisma/client').Prisma.Decimal }): Promise<boolean> {
    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.vipPaymentProof.updateMany({
        where: {
          id: input.id,
          status: VipPaymentProofStatus.PENDING_CONFIRMATION,
        },
        data: {
          status: VipPaymentProofStatus.CONFIRMED,
          reviewedById: input.reviewedById,
          reviewedAt: input.reviewedAt,
        },
      });

      if (updated.count === 0) {
        return false;
      }

      const proof = await tx.vipPaymentProof.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!proof) {
        return false;
      }

      await tx.user.update({
        where: { id: proof.userId },
        data: {
          totalGeneratedAmount: {
            increment: input.amountUsd,
          },
        },
      });

      return true;
    });
  }

  async cancelPending(input: {
    id: string;
    reason: string;
    reviewedById: string;
    reviewedAt: Date;
  }): Promise<boolean> {
    const result = await this.prisma.vipPaymentProof.updateMany({
      where: {
        id: input.id,
        status: VipPaymentProofStatus.PENDING_CONFIRMATION,
      },
      data: {
        status: VipPaymentProofStatus.CANCELED,
        cancelReason: input.reason,
        reviewedById: input.reviewedById,
        reviewedAt: input.reviewedAt,
      },
    });

    return result.count > 0;
  }
}