import { IdentityStatus, DocumentType } from '@prisma/client';

export type IdentitySubmission = {
  userId: string;
  documentType: DocumentType;
  documentNumber: string;
  fullName: string;
  birthDate?: Date;
  country?: string;
  city?: string;
  addressLine1?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
};

export interface IdentityCommandPort {
  upsertSubmission(input: IdentitySubmission): Promise<void>;
  review(input: { userId: string; status: IdentityStatus; reviewedById: string; rejectionReason?: string }): Promise<void>;
}
