import { RemittanceStatus } from '@prisma/client';

export type RemittanceStatusNotificationEvent =
  | 'PAYMENT_REPORTED'
  | 'PAYMENT_CONFIRMED'
  | 'REMITTANCE_DELIVERED'
  | 'CANCELLED_BY_CLIENT'
  | 'CANCELLED_BY_ADMIN';

export interface RemittanceStatusNotificationPayload {
  to: string;
  remittanceId: string;
  status: RemittanceStatus;
  event: RemittanceStatusNotificationEvent;
  statusDescription?: string | null;
}

export interface RemittanceStatusNotifierPort {
  notifyStatusChange(input: RemittanceStatusNotificationPayload): Promise<void>;
}
