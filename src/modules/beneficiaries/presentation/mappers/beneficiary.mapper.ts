import { BeneficiaryEntity } from '../../domain/entities/beneficiary.entity';
import { BeneficiaryType } from '../graphql/types/beneficiary.type';

export class BeneficiaryMapper {
  static toGraphQL(e: BeneficiaryEntity): BeneficiaryType {
    return {
      id: e.id,
      fullName: e.fullName,
      phone: e.phone ?? undefined,
      email: e.email ?? undefined,
      country: e.country,
      city: e.city ?? undefined,
      addressLine1: e.addressLine1 ?? undefined,
      postalCode: e.postalCode ?? undefined,
      documentType: e.documentType ?? undefined,
      documentNumber: e.documentNumber ?? undefined,
      relationship: e.relationship ?? undefined,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}
