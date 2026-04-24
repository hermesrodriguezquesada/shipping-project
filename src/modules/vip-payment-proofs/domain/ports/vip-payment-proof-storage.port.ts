export interface VipPaymentProofViewRequest {
  key: string;
  expiresInSeconds: number;
}

export interface VipPaymentProofObjectUploadRequest {
  key: string;
  mimeType: string;
  body: Buffer;
}

export interface VipPaymentProofStoragePort {
  createPresignedViewUrl(input: VipPaymentProofViewRequest): Promise<string>;
  uploadObject(input: VipPaymentProofObjectUploadRequest): Promise<void>;
  exists(input: { key: string }): Promise<boolean>;
}