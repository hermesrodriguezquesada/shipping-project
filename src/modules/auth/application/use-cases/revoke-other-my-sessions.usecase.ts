import { Inject, Injectable } from '@nestjs/common';
import { SESSION_STORE } from 'src/shared/constants/tokens';
import { SessionStorePort } from '../../domain/ports/session-store.port';
import { UnauthorizedDomainException } from 'src/core/exceptions/domain/unauthorized.exception';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';

@Injectable()
export class RevokeOtherMySessionsUseCase {
  constructor(
    @Inject(SESSION_STORE)
    private readonly sessions: SessionStorePort,
  ) {}

  async execute(input: { userId: string; currentSessionId: string }): Promise<boolean> {
    const current = await this.sessions.findById(input.currentSessionId);
    if (!current) throw new NotFoundDomainException('Current session not found');

    if (current.userId !== input.userId) {
      throw new UnauthorizedDomainException('Current session does not belong to user');
    }

    await this.sessions.revokeAllForUserExcept(input.userId, input.currentSessionId);
    return true;
  }
}
