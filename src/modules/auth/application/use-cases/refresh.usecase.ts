import { Inject, Injectable } from '@nestjs/common';
import { SESSION_STORE, TOKEN_SERVICE, PASSWORD_HASHER, USER_QUERY_PORT } from 'src/shared/constants/tokens';
import { UnauthorizedDomainException } from 'src/core/exceptions/domain/unauthorized.exception';

import { SessionStorePort } from '../../domain/ports/session-store.port';
import { TokenServicePort } from '../../domain/ports/token-service.port';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { UserQueryPort } from 'src/modules/users/domain/ports/user-query.port';
import { AppConfigService } from 'src/core/config/config.service';

type RefreshPayload = { sub: string; sid: string };

@Injectable()
export class RefreshUseCase {
  constructor(
    @Inject(SESSION_STORE) 
    private readonly sessions: SessionStorePort,
    @Inject(TOKEN_SERVICE) 
    private readonly tokens: TokenServicePort,
    @Inject(PASSWORD_HASHER) 
    private readonly hasher: PasswordHasherPort,
    @Inject(USER_QUERY_PORT) 
    private readonly users: UserQueryPort,
    private readonly config: AppConfigService,
  ) {}

  async execute(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; sessionId: string; userId: string }> {
    let payload: RefreshPayload;
    try {
      payload = await this.tokens.verifyRefresh<RefreshPayload>(refreshToken);
    } catch {
      throw new UnauthorizedDomainException('Invalid refresh token');
    }

    const session = await this.sessions.findById(payload.sid);
    if (!session) throw new UnauthorizedDomainException('Invalid refresh token');

    if (session.revokedAt) throw new UnauthorizedDomainException('Session revoked');
    if (session.expiresAt.getTime() < Date.now()) throw new UnauthorizedDomainException('Session expired');

    const hashOk = await this.hasher.compare(refreshToken, session.refreshTokenHash);
    if (!hashOk) throw new UnauthorizedDomainException('Invalid refresh token');

    // validar usuario activo
    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive || user.isDeleted) {
      throw new UnauthorizedDomainException('User is disabled');
    }

    // ROTACIÓN: revocar sesión actual y crear nueva sesión
    await this.sessions.revoke(session.id);

    const newExpiresAt = this.computeRefreshExpiresAt(this.config.jwtRefreshExpiresIn);
    const newSession = await this.sessions.create({
      userId: user.id,
      refreshTokenHash: 'temp',
      expiresAt: newExpiresAt,
    });

    const accessToken = await this.tokens.signAccess({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    const newRefreshToken = await this.tokens.signRefresh({
      sub: user.id,
      sid: newSession.id,
    });

    const newHash = await this.hasher.hash(newRefreshToken);
    await this.sessions.setRefreshHash(newSession.id, newHash);

    return { accessToken, refreshToken: newRefreshToken, sessionId: newSession.id, userId: user.id };
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
