export interface PaymentMethodRef {
  id: string;
  code: string;
  enabled: boolean;
  additionalData: string | null;
}

export interface PaymentMethodAvailabilityPort {
  findEnabledPaymentMethodByCode(input: { code: string }): Promise<PaymentMethodRef | null>;
}
