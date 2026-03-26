import { ReceptionPayoutMethod } from '@prisma/client';

export interface ReceptionMethodRef {
  id: string;
  code: string;
  enabled: boolean;
  currencyCode: string;
  method: ReceptionPayoutMethod;
}

export interface ReceptionMethodAvailabilityPort {
  findEnabledReceptionMethodByCode(input: { code: string }): Promise<ReceptionMethodRef | null>;
}
