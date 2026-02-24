import { Inject, Injectable } from '@nestjs/common';
import { MAILER_PORT, PASSWORD_RESET_STORE, USER_AUTH_PORT } from 'src/shared/constants/tokens';
import { UserAuthPort } from 'src/modules/users/domain/ports/user-auth.port';
import { AppConfigService } from 'src/core/config/config.service';
import { MailerPort } from 'src/core/notifications/ports/mailer.port';
import { PasswordResetStorePort } from '../../domain/ports/password-reset-store.port';

import { randomBytes, createHash } from 'crypto';

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(USER_AUTH_PORT) private readonly userAuth: UserAuthPort,
    @Inject(PASSWORD_RESET_STORE) private readonly store: PasswordResetStorePort,
    @Inject(MAILER_PORT) private readonly mailer: MailerPort,
    private readonly config: AppConfigService,
  ) {}

  async execute(email: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    const user = await this.userAuth.findAuthByEmail(normalized);

    // ✅ evitar enumeración: siempre true
    if (!user || !user.isActive || user.isDeleted) return true;

    // opcional: borrar tokens previos del usuario (reduce superficie)
    await this.store.deleteAllForUser(user.id);

    // token en claro solo para link
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(Date.now() + this.config.passwordResetTtlMinutes * 60 * 1000);

    await this.store.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${this.config.frontendUrl}/reset_password?hash=${token}`;

    await this.mailer.sendPasswordResetEmail({
      to: user.email,
      resetUrl,
    });

    return true;
  }
}
