import { BeneficiaryRelationship, DocumentType } from '@prisma/client';

export type CreateBeneficiaryDto = {
  ownerUserId: string;
  fullName: string;
  phone: string;
  email?: string;
  country: string;
  city?: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode?: string;
  documentType?: DocumentType;
  documentNumber: string;
  relationship?: BeneficiaryRelationship;
  deliveryInstructions?: string;
};
