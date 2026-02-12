import { Role } from '@prisma/client';

export interface AuthContextUser {
  id: string;
  email: string;
  roles: Role[];
}
