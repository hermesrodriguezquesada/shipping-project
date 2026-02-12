import { IdentityStatus } from '@prisma/client';

export type IdentityVerificationView = {
  userId: string;
  status: IdentityStatus;
  documentType?: any;
  documentNumber?: string;
  fullName?: string;
  birthDate?: Date;
  country?: string;
  city?: string;
  addressLine1?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  reviewedAt?: Date;
  reviewedById?: string;
  rejectionReason?: string;
};

export interface IdentityQueryPort {
  getByUserId(userId: string): Promise<IdentityVerificationView | null>;
  listByStatus(status: IdentityStatus, pagination?: { offset?: number; limit?: number }): Promise<IdentityVerificationView[]>;
}
