import { Inject, Injectable } from '@nestjs/common';
import { SESSION_STORE } from 'src/shared/constants/tokens';
import { SessionStorePort } from '../../domain/ports/session-store.port';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { UnauthorizedDomainException } from 'src/core/exceptions/domain/unauthorized.exception';

@Injectable()
export class RevokeMySessionUseCase {
  constructor(
    @Inject(SESSION_STORE)
    private readonly sessions: SessionStorePort,
  ) {}

  async execute(input: { userId: string; sessionId: string }): Promise<boolean> {
    const session = await this.sessions.findById(input.sessionId);
    if (!session) throw new NotFoundDomainException('Session not found');

    if (session.userId !== input.userId) {
      throw new UnauthorizedDomainException('You cannot revoke a session that is not yours');
    }

    await this.sessions.revoke(input.sessionId);
    return true;
  }
}
