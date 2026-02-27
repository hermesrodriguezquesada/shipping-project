export interface PaymentMethodRef {
  id: string;
  code: string;
  enabled: boolean;
}

export interface PaymentMethodAvailabilityPort {
  findEnabledPaymentMethodByCode(input: { code: string }): Promise<PaymentMethodRef | null>;
}
