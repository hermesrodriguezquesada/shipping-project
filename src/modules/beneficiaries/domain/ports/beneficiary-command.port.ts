import { BeneficiaryEntity } from '../entities/beneficiary.entity';
import { BeneficiaryRelationship, DocumentType } from '@prisma/client';

export type CreateBeneficiaryData = {
  ownerUserId: string;
  fullName: string;
  phone?: string;
  email?: string;
  country: string;
  city?: string;
  addressLine1?: string;
  postalCode?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  relationship?: BeneficiaryRelationship;
};

export type UpdateBeneficiaryData = {
  id: string;
  ownerUserId: string;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  country?: string;
  city?: string | null;
  addressLine1?: string | null;
  postalCode?: string | null;
  documentType?: DocumentType | null;
  documentNumber?: string | null;
  relationship?: BeneficiaryRelationship | null;
};

export interface BeneficiaryCommandPort {
  create(data: CreateBeneficiaryData): Promise<BeneficiaryEntity>;
  update(data: UpdateBeneficiaryData): Promise<BeneficiaryEntity>;
  softDelete(input: { id: string; ownerUserId: string }): Promise<void>;
}
