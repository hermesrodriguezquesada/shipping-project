export type ListBeneficiariesDto = {
  ownerUserId: string;
  offset?: number;
  limit?: number;
  includeDeleted?: boolean; // por ahora lo dejo en false en el resolver
};
