import { UserIdentityVerification } from '@prisma/client';
import { IdentityVerificationView } from '../../domain/ports/identity-query.port';

export class IdentityPersistenceMapper {
  static toView(row: UserIdentityVerification): IdentityVerificationView {
    return {
      userId: row.userId,
      status: row.status,

      documentType: row.documentType ?? undefined,
      documentNumber: row.documentNumber ?? undefined,
      fullName: row.fullName ?? undefined,
      birthDate: row.birthDate ?? undefined,
      country: row.country ?? undefined,
      city: row.city ?? undefined,
      addressLine1: row.addressLine1 ?? undefined,

      documentFrontUrl: row.documentFrontUrl ?? undefined,
      documentBackUrl: row.documentBackUrl ?? undefined,
      selfieUrl: row.selfieUrl ?? undefined,

      reviewedAt: row.reviewedAt ?? undefined,
      reviewedById: row.reviewedById ?? undefined,
      rejectionReason: row.rejectionReason ?? undefined,
    };
  }
}
