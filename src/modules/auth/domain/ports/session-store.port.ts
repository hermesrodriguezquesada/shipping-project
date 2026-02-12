export type Session = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  revokedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export interface SessionStorePort {
  create(input: { userId: string; refreshTokenHash: string; expiresAt: Date }): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  setRefreshHash(sessionId: string, refreshTokenHash: string): Promise<void>;
  revoke(sessionId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  listForUser(userId: string, pagination?: { offset?: number; limit?: number }): Promise<Session[]>;
  revokeAllForUserExcept(userId: string, keepSessionId: string): Promise<void>;
}
