import { Inject, Injectable } from '@nestjs/common';
import { SESSION_STORE } from 'src/shared/constants/tokens';
import { SessionStorePort, Session } from '../../domain/ports/session-store.port';

@Injectable()
export class ListMySessionsUseCase {
  constructor(
    @Inject(SESSION_STORE)
    private readonly sessions: SessionStorePort,
  ) {}

  execute(userId: string, pagination?: { offset?: number; limit?: number }): Promise<Session[]> {
    return this.sessions.listForUser(userId, pagination);
  }
}
