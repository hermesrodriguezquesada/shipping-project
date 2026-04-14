export interface RemittancePaymentProofUploadRequest {
  key: string;
  mimeType: string;
  expiresInSeconds: number;
}

export interface RemittancePaymentProofViewRequest {
  key: string;
  expiresInSeconds: number;
}

export interface RemittancePaymentProofObjectUploadRequest {
  key: string;
  mimeType: string;
  body: Buffer;
}

export interface RemittancePaymentProofStoragePort {
  createPresignedUploadUrl(input: RemittancePaymentProofUploadRequest): Promise<string>;
  createPresignedViewUrl(input: RemittancePaymentProofViewRequest): Promise<string>;
  uploadObject(input: RemittancePaymentProofObjectUploadRequest): Promise<void>;
  exists(input: { key: string }): Promise<boolean>;
}
