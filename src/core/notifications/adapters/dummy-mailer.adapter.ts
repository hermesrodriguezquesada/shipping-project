import { Injectable, Logger } from '@nestjs/common';
import { MailerPort } from '../ports/mailer.port';

@Injectable()
export class DummyMailerAdapter implements MailerPort {
  private readonly logger = new Logger(DummyMailerAdapter.name);

  async sendPasswordResetEmail(input: { to: string; resetUrl: string }): Promise<void> {
    this.logger.log(`[DUMMY EMAIL] to=${input.to} resetUrl=${input.resetUrl}`);
  }
}
