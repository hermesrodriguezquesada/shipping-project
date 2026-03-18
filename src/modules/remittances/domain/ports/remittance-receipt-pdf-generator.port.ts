export interface RemittanceReceiptPdfData {
  remittanceId: string;
  statusLabel: string;
  createdAt: Date;
  updatedAt: Date;
  exchangeRateUsedAt: Date | null;
  ownerName: string;
  ownerEmail: string;
  recipient: {
    fullName: string;
    phone: string;
    country: string;
    addressLine1: string;
    documentNumber: string;
    email: string | null;
    city: string | null;
    addressLine2: string | null;
    postalCode: string | null;
  };
  sentAmount: string;
  receivedAmount: string | null;
  paymentCurrencyCode: string | null;
  receivingCurrencyCode: string | null;
  paymentMethodLabel: string | null;
  receptionMethodLabel: string | null;
  appliedExchangeRate: string | null;
  paymentDetails: string | null;
  statusDescription: string | null;
}

export interface RemittanceReceiptPdfGeneratorPort {
  generate(input: RemittanceReceiptPdfData): Promise<Buffer>;
}
