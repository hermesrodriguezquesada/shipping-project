import { BeneficiaryRelationship, DocumentType } from '@prisma/client';

export type UpdateBeneficiaryDto = {
  id: string;
  ownerUserId: string;
  fullName?: string;
  phone?: string;
  email?: string | null;
  country?: string;
  city?: string | null;
  addressLine1?: string;
  addressLine2?: string | null;
  postalCode?: string | null;
  documentType?: DocumentType | null;
  documentNumber?: string;
  relationship?: BeneficiaryRelationship | null;
  deliveryInstructions?: string | null;
};
