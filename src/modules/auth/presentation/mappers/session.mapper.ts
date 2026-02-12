import { Session } from 'src/modules/auth/domain/ports/session-store.port';
import { SessionType } from '../graphql/types/session.type';


export class SessionGraphqlMapper {
  static toGraphQL(s: Session): SessionType {
    const now = Date.now();
    const active = !s.revokedAt && s.expiresAt.getTime() > now;

    return {
      id: s.id,
      userId: s.userId,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      revokedAt: s.revokedAt ?? undefined,
      isActive: active,
    };
  }

  static toGraphQLList(list: Session[]): SessionType[] {
    return list.map(this.toGraphQL);
  }
}
