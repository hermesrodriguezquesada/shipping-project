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

  async sendRemittanceStatusEmail(input: {
    to: string;
    remittanceId: string;
    status: string;
    event: string;
    statusDescription?: string | null;
  }): Promise<void> {
    const eventLabel = this.resolveEventLabel(input.event);
    const subject = `Actualización de remesa ${input.remittanceId}: ${eventLabel}`;
    const details = input.statusDescription?.trim()
      ? `\nDetalle: ${input.statusDescription.trim()}`
      : '';

    await this.transport.sendMail({
      from: this.config.emailFrom,
      to: input.to,
      subject,
      text: `Tu remesa ${input.remittanceId} cambió a estado ${input.status}.${details}`,
      html: `<p>Tu remesa <strong>${input.remittanceId}</strong> cambió a estado <strong>${input.status}</strong>.</p>${
        details ? `<p>${details.trim()}</p>` : ''
      }`,
    });
  }

  private resolveEventLabel(event: string): string {
    const map: Record<string, string> = {
      PAYMENT_REPORTED: 'Pago reportado',
      PAYMENT_CONFIRMED: 'Pago confirmado',
      REMITTANCE_DELIVERED: 'Remesa entregada',
      CANCELLED_BY_CLIENT: 'Remesa cancelada por cliente',
      CANCELLED_BY_ADMIN: 'Remesa cancelada por admin',
    };

    return map[event] ?? 'Cambio de estado';
  }
}
