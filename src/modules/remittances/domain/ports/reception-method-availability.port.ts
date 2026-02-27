export interface ReceptionMethodRef {
  id: string;
  code: string;
  enabled: boolean;
}

export interface ReceptionMethodAvailabilityPort {
  findEnabledReceptionMethodByCode(input: { code: string }): Promise<ReceptionMethodRef | null>;
}
