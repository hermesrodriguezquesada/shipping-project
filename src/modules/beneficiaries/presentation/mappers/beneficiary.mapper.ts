import { BeneficiaryEntity } from '../../domain/entities/beneficiary.entity';
import { BeneficiaryType } from '../graphql/types/beneficiary.type';

export class BeneficiaryMapper {
  static toGraphQL(e: BeneficiaryEntity): BeneficiaryType {
    return {
      id: e.id,
      fullName: e.fullName,
      phone: e.phone,
      email: e.email ?? undefined,
      country: e.country,
      city: e.city ?? undefined,
      addressLine1: e.addressLine1,
      addressLine2: e.addressLine2 ?? undefined,
      postalCode: e.postalCode ?? undefined,
      documentType: e.documentType ?? undefined,
      documentNumber: e.documentNumber,
      relationship: e.relationship ?? undefined,
      deliveryInstructions: e.deliveryInstructions ?? undefined,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}
