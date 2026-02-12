import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  USER_AUTH_PORT,
  USER_COMMAND_PORT,
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  SESSION_STORE,
} from 'src/shared/constants/tokens';
import { ConflictDomainException } from 'src/core/exceptions/domain/conflict.exception';

import { UserAuthPort } from 'src/modules/users/domain/ports/user-auth.port';
import { UserCommandPort } from 'src/modules/users/domain/ports/user-command.port';

import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { TokenServicePort } from '../../domain/ports/token-service.port';
import { Credentials } from '../../domain/value-objects/credentials.vo';
import { RegisterInputDto } from '../dto/register.input.dto';
import { SessionStorePort } from '../../domain/ports/session-store.port';
import { AppConfigService } from 'src/core/config/config.service';
import { normalizeRoles } from 'src/shared/utils/normaliceRoles';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_AUTH_PORT) private readonly userAuth: UserAuthPort,
    @Inject(USER_COMMAND_PORT) private readonly userCommands: UserCommandPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
    @Inject(SESSION_STORE) private readonly sessions: SessionStorePort,
    private readonly config: AppConfigService,
  ) {}

  async execute(input: RegisterInputDto): Promise<{
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    user: { id: string; email: string; roles: Role[] };
  }> {
    const creds = Credentials.create(input.email, input.password);
    const email = creds.email.trim().toLowerCase();

    const existing = await this.userAuth.findAuthByEmail(email);
    if (existing) throw new ConflictDomainException('Email already in use');

    const passwordHash = await this.passwordHasher.hash(creds.password);

    const user = await this.userCommands.create({
      email,
      passwordHash,
      roles: normalizeRoles(undefined),
    });

    const expiresAt = this.computeRefreshExpiresAt(this.config.jwtRefreshExpiresIn);
    const session = await this.sessions.create({
      userId: user.id,
      refreshTokenHash: 'temp',
      expiresAt,
    });

    const accessToken = await this.tokenService.signAccess({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    const refreshToken = await this.tokenService.signRefresh({
      sub: user.id,
      sid: session.id,
    });

    const refreshTokenHash = await this.passwordHasher.hash(refreshToken);
    await this.sessions.setRefreshHash(session.id, refreshTokenHash);

    return {
      accessToken,
      refreshToken,
      sessionId: session.id,
      user: { id: user.id, email: user.email, roles: user.roles },
    };
  }

  private computeRefreshExpiresAt(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());
    if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const value = Number(match[1]);
    const unit = match[2];

    const ms =
      unit === 's' ? value * 1000 :
      unit === 'm' ? value * 60 * 1000 :
      unit === 'h' ? value * 60 * 60 * 1000 :
      value * 24 * 60 * 60 * 1000;

    return new Date(Date.now() + ms);
  }
}
