import { Role } from '@prisma/client';

export type UserAuthView = {
  id: string;
  email: string;
  passwordHash: string;
  roles: Role[];
  isActive: boolean;
  isDeleted: boolean;
};

export interface UserAuthPort {
  findAuthByEmail(email: string): Promise<UserAuthView | null>;
}
