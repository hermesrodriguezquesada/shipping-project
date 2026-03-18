import { Inject, Injectable } from '@nestjs/common';
import { MailerPort } from 'src/core/notifications/ports/mailer.port';
import { MAILER_PORT } from 'src/shared/constants/tokens';
import {
  RemittanceStatusNotificationPayload,
  RemittanceStatusNotifierPort,
} from '../../domain/ports/remittance-status-notifier.port';

@Injectable()
export class MailerRemittanceStatusNotifierAdapter implements RemittanceStatusNotifierPort {
  constructor(
    @Inject(MAILER_PORT)
    private readonly mailer: MailerPort,
  ) {}

  async notifyStatusChange(input: RemittanceStatusNotificationPayload): Promise<void> {
    await this.mailer.sendRemittanceStatusEmail({
      to: input.to,
      remittanceId: input.remittanceId,
      status: input.status,
      event: input.event,
      statusDescription: input.statusDescription,
    });
  }
}
