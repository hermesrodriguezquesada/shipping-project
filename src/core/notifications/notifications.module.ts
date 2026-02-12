import { Module } from '@nestjs/common';
import { MAILER_PORT } from 'src/shared/constants/tokens';
import { DummyMailerAdapter } from './adapters/dummy-mailer.adapter';
import { SmtpMailerAdapter } from './adapters/smtp-mailer.adapter';
import { AppConfigModule } from 'src/core/config/config.module';
import { AppConfigService } from 'src/core/config/config.service';

@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: MAILER_PORT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        return config.emailProvider === 'smtp'
          ? new SmtpMailerAdapter(config)
          : new DummyMailerAdapter();
      },
    },
  ],
  exports: [MAILER_PORT],
})
export class NotificationsModule {}
