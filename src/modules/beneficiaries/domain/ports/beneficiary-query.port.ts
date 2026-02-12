import { BeneficiaryEntity } from '../entities/beneficiary.entity';

export interface BeneficiaryQueryPort {
  findById(input: { id: string; ownerUserId: string }): Promise<BeneficiaryEntity | null>;
  listByOwner(input: { ownerUserId: string; offset: number; limit: number; includeDeleted?: boolean }): Promise<BeneficiaryEntity[]>;
}
