import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService
  ) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get databaseUrl(): string {
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    if (!dbUrl) {
    throw new Error('DATABASE_URL is not defined');
    }
    return dbUrl;
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'changeme');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '1d');
  }

  get emailFrom(): string {
    return this.configService.get<string>('EMAIL_FROM', 'no-reply@shipping.local');
  }

  get emailProvider(): string {
    return this.configService.get<string>('EMAIL_PROVIDER', 'dummy'); // 'sendgrid' | 'resend' | ...
  }

  get sendgridApiKey(): string | undefined {
    return this.configService.get<string>('SENDGRID_API_KEY');
  }

  get resendApiKey(): string | undefined {
    return this.configService.get<string>('RESEND_API_KEY');
  }

  get paymentsProvider(): string {
    return this.configService.get<string>('PAYMENTS_PROVIDER', 'dummy'); // 'dummy' | 'stripe' | 'paypal'
  }

  get stripeSecretKey(): string | undefined {
    return this.configService.get<string>('STRIPE_SECRET_KEY');
  }

  get stripeWebhookSecret(): string | undefined {
    return this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
  }

    get jwtAccessExpiresIn(): string {
    return this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '900s');
  }

  get jwtRefreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
  }

  get jwtRefreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET', 'changeme_refresh');
  }

  get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
  }

  get passwordResetTtlMinutes(): number {
    return this.configService.get<number>('PASSWORD_RESET_TTL_MINUTES', 30);
  }

  get smtpHost(): string {
    return this.configService.get<string>('SMTP_HOST', 'localhost');
  }

  get smtpPort(): number {
    return this.configService.get<number>('SMTP_PORT', 2525);
  }
  get smtpUser(): string | undefined {
    return this.configService.get<string>('SMTP_USER');
  }
  get smtpPass(): string | undefined {
    return this.configService.get<string>('SMTP_PASS');
  }

}
