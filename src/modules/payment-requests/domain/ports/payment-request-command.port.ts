import { Prisma, PaymentRequestMethod, PaymentRequestStatus } from '@prisma/client';
import { PaymentRequestEntity } from '../entities/payment-request.entity';

export interface CreatePaymentRequestCommandInput {
  ownerUserId: string;
  amount: Prisma.Decimal;
  currencyId: string;
  exchangeRate: Prisma.Decimal;
  deliveryFee: Prisma.Decimal;
  amountToPay: Prisma.Decimal;
  method: PaymentRequestMethod;
  account: string | null;
  address: string | null;
  delivery: boolean;
}

export interface UpdatePaymentRequestStatusInput {
  id: string;
  status: PaymentRequestStatus;
  canceledReason?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
}

export interface RenegotiatePaymentRequestInput {
  id: string;
  newAmount: Prisma.Decimal;
  amountToPay: Prisma.Decimal;
  reviewedById: string;
  reviewedAt: Date;
  canceledReason?: string | null;
}

export interface CompletePaymentRequestInput {
  id: string;
  paidById: string;
}

export interface PaymentRequestCommandPort {
  create(input: CreatePaymentRequestCommandInput): Promise<PaymentRequestEntity>;
  updateStatus(input: UpdatePaymentRequestStatusInput): Promise<PaymentRequestEntity>;
  renegotiate(input: RenegotiatePaymentRequestInput): Promise<PaymentRequestEntity>;
  completeAndDecrementBalance(input: CompletePaymentRequestInput): Promise<PaymentRequestEntity>;
}
