import { Inject, Injectable } from '@nestjs/common';
import { PASSWORD_HASHER, PASSWORD_RESET_STORE, USER_COMMAND_PORT } from 'src/shared/constants/tokens';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { PasswordResetStorePort } from '../../domain/ports/password-reset-store.port';
import { UserCommandPort } from 'src/modules/users/domain/ports/user-command.port';
import { UnauthorizedDomainException } from 'src/core/exceptions/domain/unauthorized.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';

import { createHash } from 'crypto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(PASSWORD_RESET_STORE) 
    private readonly store: PasswordResetStorePort,
    @Inject(PASSWORD_HASHER) 
    private readonly hasher: PasswordHasherPort,
    @Inject(USER_COMMAND_PORT) 
    private readonly userCommands: UserCommandPort,
  ) {}

  async execute(input: { token: string; newPassword: string }): Promise<boolean> {
    if (!input.token) throw new ValidationDomainException('Token is required');
    if (!input.newPassword || input.newPassword.length < 6) {
      throw new ValidationDomainException('Password must be at least 6 characters');
    }

    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const record = await this.store.findByTokenHash(tokenHash);

    if (!record) throw new UnauthorizedDomainException('Invalid token');
    if (record.usedAt) throw new UnauthorizedDomainException('Token already used');
    if (record.expiresAt.getTime() < Date.now()) throw new UnauthorizedDomainException('Token expired');

    const passwordHash = await this.hasher.hash(input.newPassword);

    await this.userCommands.updatePassword({ id: record.userId, passwordHash });
    await this.store.markUsed(record.id);

    // opcional: invalidar otras sesiones (logout global)
    // (si quieres, lo conectamos con SessionStorePort)
    return true;
  }
}
