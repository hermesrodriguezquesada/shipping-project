export interface ReceptionMethodRef {
  id: string;
  code: string;
  enabled: boolean;
  currencyCode: string;
}

export interface ReceptionMethodAvailabilityPort {
  findEnabledReceptionMethodByCode(input: { code: string }): Promise<ReceptionMethodRef | null>;
}
