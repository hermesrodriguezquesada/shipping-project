import { Injectable, Logger } from '@nestjs/common';
import { MailerPort } from '../ports/mailer.port';

@Injectable()
export class DummyMailerAdapter implements MailerPort {
  private readonly logger = new Logger(DummyMailerAdapter.name);

  async sendPasswordResetEmail(input: { to: string; resetUrl: string }): Promise<void> {
    this.logger.log(`[DUMMY EMAIL] to=${input.to} resetUrl=${input.resetUrl}`);
  }

  async sendRemittanceStatusEmail(input: {
    to: string;
    remittanceId: string;
    status: string;
    event: string;
    statusDescription?: string | null;
  }): Promise<void> {
    const detail = input.statusDescription?.trim() ? ` statusDescription=${input.statusDescription.trim()}` : '';
    this.logger.log(
      `[DUMMY EMAIL] to=${input.to} remittanceId=${input.remittanceId} event=${input.event} status=${input.status}${detail}`,
    );
  }
}
