export interface MailerPort {
  sendPasswordResetEmail(input: { to: string; resetUrl: string }): Promise<void>;
}
