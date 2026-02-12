import { IdentityVerificationView } from '../../domain/ports/identity-query.port';
import { IdentityVerificationType } from '../graphql/types/identity.type';

export class IdentityGraphqlMapper {
  static toGraphQL(view: IdentityVerificationView): IdentityVerificationType {
    return {
      userId: view.userId,
      status: view.status,

      documentType: view.documentType,
      documentNumber: view.documentNumber,
      fullName: view.fullName,
      birthDate: view.birthDate,
      country: view.country,
      city: view.city,
      addressLine1: view.addressLine1,

      documentFrontUrl: view.documentFrontUrl,
      documentBackUrl: view.documentBackUrl,
      selfieUrl: view.selfieUrl,

      reviewedAt: view.reviewedAt,
      reviewedById: view.reviewedById,
      rejectionReason: view.rejectionReason,
    };
  }

  static toGraphQLList(views: IdentityVerificationView[]): IdentityVerificationType[] {
    return views.map(this.toGraphQL);
  }
}
