import { BeneficiaryRelationship, DocumentType } from '@prisma/client';

export type BeneficiaryEntity = {
  id: string;
  ownerUserId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  country: string;
  city?: string | null;
  addressLine1?: string | null;
  postalCode?: string | null;
  documentType?: DocumentType | null;
  documentNumber?: string | null;
  relationship?: BeneficiaryRelationship | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
