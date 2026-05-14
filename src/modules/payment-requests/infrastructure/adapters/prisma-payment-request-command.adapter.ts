import { Injectable } from '@nestjs/common';
import { PaymentRequestStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../core/database/prisma.service';
import { DomainException } from '../../../../core/exceptions/domain/domain.exception';
import { ValidationDomainException } from '../../../../core/exceptions/domain/validation.exception';
import {
  CompletePaymentRequestInput,
  CreatePaymentRequestCommandInput,
  PaymentRequestCommandPort,
  RenegotiatePaymentRequestInput,
  UpdatePaymentRequestStatusInput,
} from '../../domain/ports/payment-request-command.port';
import { PaymentRequestEntity } from '../../domain/entities/payment-request.entity';
import { PrismaPaymentRequestQueryAdapter } from './prisma-payment-request-query.adapter';

@Injectable()
export class PrismaPaymentRequestCommandAdapter implements PaymentRequestCommandPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryAdapter: PrismaPaymentRequestQueryAdapter,
  ) {}

  async create(input: CreatePaymentRequestCommandInput): Promise<PaymentRequestEntity> {
    const created = await this.prisma.paymentRequest.create({
      data: {
        ownerUserId: input.ownerUserId,
        amount: input.amount,
        currencyId: input.currencyId,
        exchangeRate: input.exchangeRate,
        deliveryFee: input.deliveryFee,
        amountToPay: input.amountToPay,
        method: input.method,
        account: input.account,
        address: input.address,
        delivery: input.delivery,
      },
      include: {
        owner: true,
        currency: true,
        reviewedBy: true,
        paidBy: true,
      },
    });
    return this.queryAdapter.findByIdOrThrow(created.id);
  }

  async updateStatus(input: UpdatePaymentRequestStatusInput): Promise<PaymentRequestEntity> {
    await this.prisma.paymentRequest.update({
      where: { id: input.id },
      data: {
        status: input.status,
        ...(input.canceledReason !== undefined ? { canceledReason: input.canceledReason } : {}),
        ...(input.reviewedById !== undefined ? { reviewedById: input.reviewedById } : {}),
        ...(input.reviewedAt !== undefined ? { reviewedAt: input.reviewedAt } : {}),
      },
    });
    return this.queryAdapter.findByIdOrThrow(input.id);
  }

  async renegotiate(input: RenegotiatePaymentRequestInput): Promise<PaymentRequestEntity> {
    await this.prisma.paymentRequest.update({
      where: { id: input.id },
      data: {
        status: PaymentRequestStatus.RENEGOTIATING,
        newAmount: input.newAmount,
        reviewedById: input.reviewedById,
        reviewedAt: input.reviewedAt,
        ...(input.canceledReason !== undefined ? { canceledReason: input.canceledReason } : {}),
      },
    });
    return this.queryAdapter.findByIdOrThrow(input.id);
  }

  async completeAndDecrementBalance(input: CompletePaymentRequestInput): Promise<PaymentRequestEntity> {
    await this.prisma.$transaction(async (tx) => {
      // Idempotency: only update if still ACCEPTED
      const updated = await tx.paymentRequest.updateMany({
        where: { id: input.id, status: PaymentRequestStatus.ACCEPTED },
        data: {
          status: PaymentRequestStatus.PAID,
          paidById: input.paidById,
          paidAt: new Date(),
        },
      });

      if (updated.count === 0) {
        // Already processed — return if PAID (idempotent), throw otherwise
        const existing = await tx.paymentRequest.findUnique({
          where: { id: input.id },
          select: { status: true },
        });
        if (!existing) {
          throw new DomainException('Payment request not found');
        }
        if (existing.status === PaymentRequestStatus.PAID) {
          return; // idempotent no-op, fresh fetch happens after the transaction
        }
        throw new DomainException('Cannot complete: unexpected status');
      }

      // Re-fetch to get newAmount / amount
      const request = await tx.paymentRequest.findUnique({
        where: { id: input.id },
        select: { newAmount: true, amount: true, ownerUserId: true },
      });
      if (!request) {
        throw new DomainException('Payment request not found after update');
      }

      const effectiveAmount: Prisma.Decimal = request.newAmount ?? request.amount;

      // Re-fetch user balance to prevent negative balance
      const user = await tx.user.findUnique({
        where: { id: request.ownerUserId },
        select: { totalGeneratedAmount: true },
      });
      if (!user) {
        throw new DomainException('Owner user not found');
      }
      if (user.totalGeneratedAmount.lt(effectiveAmount)) {
        throw new ValidationDomainException('Insufficient balance at payment time');
      }

      await tx.user.update({
        where: { id: request.ownerUserId },
        data: {
          totalGeneratedAmount: { decrement: effectiveAmount },
        },
      });
    });

    // Re-fetch after the transaction commits — avoids stale read inside an uncommitted tx
    return this.queryAdapter.findByIdOrThrow(input.id);
  }
}
