export interface MailerPort {
  sendPasswordResetEmail(input: { to: string; resetUrl: string }): Promise<void>;
  sendRemittanceStatusEmail(input: {
    to: string;
    remittanceId: string;
    status: string;
    event: string;
    statusDescription?: string | null;
  }): Promise<void>;
}
