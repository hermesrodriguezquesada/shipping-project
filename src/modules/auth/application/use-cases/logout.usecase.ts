import { Inject, Injectable } from '@nestjs/common';
import { SESSION_STORE, TOKEN_SERVICE } from 'src/shared/constants/tokens';
import { UnauthorizedDomainException } from 'src/core/exceptions/domain/unauthorized.exception';
import { SessionStorePort } from '../../domain/ports/session-store.port';
import { TokenServicePort } from '../../domain/ports/token-service.port';

type RefreshPayload = { sub: string; sid: string };

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(SESSION_STORE) 
    private readonly sessions: SessionStorePort,
    @Inject(TOKEN_SERVICE) 
    private readonly tokens: TokenServicePort,
  ) {}

  async execute(refreshToken: string): Promise<boolean> {
    let payload: RefreshPayload;
    try {
      payload = await this.tokens.verifyRefresh<RefreshPayload>(refreshToken);
    } catch {
      throw new UnauthorizedDomainException('Invalid refresh token');
    }

    const session = await this.sessions.findById(payload.sid);
    if (!session) return true;

    if (session.userId !== payload.sub) {
      throw new UnauthorizedDomainException('Invalid refresh token');
    }

    await this.sessions.revoke(session.id);
    return true;
  }
}
