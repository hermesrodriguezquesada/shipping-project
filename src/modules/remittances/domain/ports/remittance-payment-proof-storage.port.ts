export interface RemittancePaymentProofUploadRequest {
  key: string;
  mimeType: string;
  expiresInSeconds: number;
}

export interface RemittancePaymentProofViewRequest {
  key: string;
  expiresInSeconds: number;
}

export interface RemittancePaymentProofStoragePort {
  createPresignedUploadUrl(input: RemittancePaymentProofUploadRequest): Promise<string>;
  createPresignedViewUrl(input: RemittancePaymentProofViewRequest): Promise<string>;
  exists(input: { key: string }): Promise<boolean>;
}
