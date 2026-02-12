export type PasswordResetRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export interface PasswordResetStorePort {
  create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<PasswordResetRecord>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null>;
  markUsed(id: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
