import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { MailerPort } from '../ports/mailer.port';
import { AppConfigService } from 'src/core/config/config.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class SmtpMailerAdapter implements MailerPort {
  private readonly transport;
  private readonly logger = new Logger(SmtpMailerAdapter.name);

  constructor(private readonly config: AppConfigService) {
    this.logger.log(`SMTP configured: host=${this.config.smtpHost} port=${this.config.smtpPort}`);

    this.transport = createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      secure: false, // smtp4dev normalmente no usa TLS
      auth: this.config.smtpUser
        ? { user: this.config.smtpUser, pass: this.config.smtpPass }
        : undefined,
    });
  }

  async sendPasswordResetEmail(input: { to: string; resetUrl: string }): Promise<void> {
    await this.transport.sendMail({
      from: this.config.emailFrom,
      to: input.to,
      subject: 'Recuperación de contraseña',
      text: `Usa este enlace para restablecer tu contraseña: ${input.resetUrl}`,
      html: `<p>Usa este enlace para restablecer tu contraseña:</p><p><a href="${input.resetUrl}">${input.resetUrl}</a></p>`,
    });
  }
}
