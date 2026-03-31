import { PaymentMethodType } from '@prisma/client';

export interface PaymentMethodRef {
  id: string;
  code: string;
  type: PaymentMethodType;
  enabled: boolean;
  additionalData: string | null;
}

export interface PaymentMethodAvailabilityPort {
  findEnabledPaymentMethodByCode(input: { code: string }): Promise<PaymentMethodRef | null>;
}
